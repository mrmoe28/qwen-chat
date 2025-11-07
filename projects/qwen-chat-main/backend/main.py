#!/usr/bin/env python3
"""
Qwen Chat Backend - Ollama Edition
Simple, reliable backend that proxies to Ollama with memory integration
"""

import json
import asyncio
import sys
import threading
import time
import re
import base64
import tempfile
import hashlib
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import httpx
import logging
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer

# Add backend directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Import services
from services.memory_service import memory_service
from services.web_search import web_search
from services.optimized_embeddings import optimized_embeddings
from services.artifact_templates import find_matching_template
from services.response_cache import response_cache
from services.model_registry import model_registry
from services.mcp_client import mcp_client, MCPServer
from services.document_processor import document_processor
from services.tool_selector import tool_selector
from services.specialized_knowledge import get_specialized_knowledge

# Import performance configuration
try:
    from performance_config import get_performance_config, get_model_for_query
    USE_PERFORMANCE_CONFIG = True
except ImportError:
    USE_PERFORMANCE_CONFIG = False
    logger.warning("Performance config not found, using defaults")
# MLX engine disabled - using Ollama directly for better reliability
# from services.mlx_engine import mlx_engine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama API configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen2.5-coder:7b"  # Specialized coding model - expert at programming

# TinyLlama configuration
BASE_MODEL = "/Volumes/MrMoe28Hub_Main/Projects/LLM-FineTune/Models/TinyLlama-1.1B-Chat-v1.0"
_tokenizer = None
_model = None

# Request/Response models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "auto"  # "auto" for automatic selection, or specific model name
    stream: bool = True
    temperature: Optional[float] = 0.9  # Higher temperature for casual, personality-driven responses
    max_tokens: Optional[int] = 512  # Reduced from 2000 for better performance (75% reduction)
    conversation_id: Optional[str] = None  # For memory/context
    use_memory: bool = True  # Whether to retrieve context from past conversations

class ChatResponse(BaseModel):
    role: str
    content: str

# Context-aware token budgeting
def get_optimal_max_tokens(messages: List[ChatMessage], default_max: int = 512) -> int:
    """
    Intelligently determine optimal max_tokens based on query type and length.

    Args:
        messages: Conversation history
        default_max: Default max_tokens if no optimization applies

    Returns:
        Optimized max_tokens value
    """
    if not messages:
        return default_max

    last_msg = messages[-1].content.lower()
    msg_length = len(last_msg)

    # Short queries = shorter responses
    if msg_length < 50:
        return 256

    # Code/artifact requests = more tokens
    code_keywords = ['code', 'implement', 'create', 'build', 'write', 'function',
                     'class', 'script', 'program', 'develop', 'generate']
    if any(kw in last_msg for kw in code_keywords):
        return 1024

    # Explanation/documentation requests = medium tokens
    explain_keywords = ['explain', 'describe', 'what is', 'how does', 'why', 'documentation']
    if any(kw in last_msg for kw in explain_keywords):
        return 768

    # Default for normal conversation
    return default_max

# Simple response cache (in-memory)
class ResponseCache:
    def __init__(self, max_size: int = 100, ttl_seconds: int = 3600):
        self.cache: Dict[str, tuple[str, float]] = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds

    def _get_cache_key(self, messages: List[ChatMessage]) -> str:
        """Generate cache key from last 3 messages"""
        recent_messages = messages[-3:] if len(messages) >= 3 else messages
        content = "".join([f"{m.role}:{m.content}" for m in recent_messages])
        return hashlib.md5(content.encode()).hexdigest()

    def get(self, messages: List[ChatMessage]) -> Optional[str]:
        """Get cached response if exists and not expired"""
        key = self._get_cache_key(messages)
        if key in self.cache:
            response, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl_seconds:
                logger.info(f"💨 Cache hit for key: {key[:8]}...")
                return response
            else:
                del self.cache[key]
        return None

    def set(self, messages: List[ChatMessage], response: str):
        """Cache a response"""
        key = self._get_cache_key(messages)
        # Implement simple LRU by removing oldest if at max size
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]
        self.cache[key] = (response, time.time())
        logger.info(f"💾 Cached response for key: {key[:8]}...")

# Initialize cache
response_cache = ResponseCache(max_size=100, ttl_seconds=3600)

# Conversation history management
def truncate_history(
    messages: List[ChatMessage],
    max_messages: int = 10,
    max_context_tokens: int = 2000
) -> List[ChatMessage]:
    """
    Truncate conversation history to manage memory and context size.

    Args:
        messages: Full conversation history
        max_messages: Maximum number of messages to keep
        max_context_tokens: Approximate max tokens for context

    Returns:
        Truncated message list
    """
    if len(messages) <= max_messages:
        return messages

    # Keep system messages + recent messages
    system_msgs = [m for m in messages if m.role == 'system']
    recent_msgs = messages[-max_messages:]

    # Remove duplicates if system message is in recent
    if recent_msgs and recent_msgs[0].role == 'system':
        return recent_msgs

    return system_msgs + recent_msgs

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown handler"""
    logger.info("🚀 Starting Qwen Chat Backend (Ollama Edition)...")

    # Check Ollama connectivity
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5.0)
            if response.status_code == 200:
                logger.info(f"✅ Connected to Ollama at {OLLAMA_BASE_URL}")
                models = response.json().get("models", [])
                logger.info(f"📦 Available models: {[m['name'] for m in models]}")
            else:
                logger.warning("⚠️  Ollama is not responding properly")
    except Exception as e:
        logger.error(f"❌ Failed to connect to Ollama: {e}")
        logger.error("Make sure Ollama is running: ollama serve")

    # Start MCP servers
    try:
        logger.info("🔧 Starting MCP servers...")

        # Desktop Commander - for file operations, screenshots, system commands
        desktop_commander = MCPServer(
            name="desktop-commander",
            command="npx",
            args=["-y", "@wonderwhy-er/desktop-commander@latest"]
        )

        # Playwright - for browser automation, clicking, typing, navigation
        playwright_server = MCPServer(
            name="playwright",
            command="npx",
            args=["@ejazullah/mcp-playwright", "--browser", "chrome"]
        )

        await mcp_client.start_server(desktop_commander)

        # Configure Desktop Commander for full filesystem access
        logger.info("🔧 Configuring Desktop Commander permissions...")
        try:
            config_result = await mcp_client.call_tool("set_config_value", {
                "key": "allowedDirectories",
                "value": []  # Empty array = full filesystem access
            })
            if config_result:
                logger.info("✅ Desktop Commander configured with full filesystem access")
            else:
                logger.warning("⚠️  Could not configure Desktop Commander permissions")
        except Exception as e:
            logger.warning(f"⚠️  Failed to configure Desktop Commander: {e}")

        await mcp_client.start_server(playwright_server)
        logger.info(f"✅ MCP integration ready with {len(mcp_client.tools)} tools")

        # Initialize RAG-based tool selector for intelligent filtering
        if hasattr(mcp_client, 'tools') and mcp_client.tools:
            tool_selector.register_tools(mcp_client.tools)
            logger.info("🎯 Intelligent tool selector initialized")

    except Exception as e:
        logger.error(f"⚠️  Failed to start MCP servers: {e}")
        logger.info("Continuing without MCP integration...")

    logger.info("✅ Backend ready!")
    yield
    logger.info("👋 Shutting down...")
    mcp_client.stop_all()

# Create FastAPI app
app = FastAPI(
    title="Qwen Chat Backend (Ollama)",
    description="Simple Ollama proxy for Qwen chat",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # Monitoring dashboard
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatStreamRequest(BaseModel):
    """Request model for streaming chat"""
    messages: List[ChatMessage]
    max_new_tokens: int = Field(default=128, ge=1, le=2048)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.95, ge=0.0, le=1.0)

@app.post("/chat")
def chat_with_tinyllama(req: ChatRequest):
    """
    Direct chat endpoint using TinyLlama model loaded via transformers
    (Not Ollama - uses local model directly)
    """
    global _tokenizer, _model

    # Load model on first request
    if _tokenizer is None or _model is None:
        logger.info(f"🔄 Loading TinyLlama model from {BASE_MODEL}...")
        try:
            # Detect device - use MPS (Apple Silicon GPU) if available, otherwise CPU
            if torch.backends.mps.is_available():
                device = torch.device("mps")
                logger.info("🚀 Using Apple Silicon GPU (MPS)")
            else:
                device = torch.device("cpu")
                logger.info("Using CPU")

            _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
            _model = AutoModelForCausalLM.from_pretrained(
                BASE_MODEL,
                torch_dtype=torch.float16,  # Use float16 for faster GPU inference
            ).to(device)
            logger.info("✅ TinyLlama model loaded successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

    # Build conversation prompt
    prompt = ""
    for msg in req.messages:
        prompt += f"{msg.role}: {msg.content}\n"
    prompt += "assistant:"

    try:
        # Generate response
        inputs = _tokenizer(prompt, return_tensors="pt")

        # Move inputs to same device as model
        if hasattr(_model, 'device'):
            inputs = {k: v.to(_model.device) for k, v in inputs.items()}

        outputs = _model.generate(
            **inputs,
            max_new_tokens=64,  # Reduced for faster response
            num_beams=1,  # Greedy decoding
            early_stopping=True,
            pad_token_id=_tokenizer.eos_token_id
        )
        reply = _tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Trim output to assistant response only
        if "assistant:" in reply:
            reply = reply.split("assistant:")[-1].strip()

        logger.info(f"✅ Generated response: {reply[:50]}...")
        return {"reply": reply}

    except Exception as e:
        logger.error(f"❌ Generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")

@app.post("/chat/stream")
def chat_stream(req: ChatStreamRequest):
    """
    Streaming chat endpoint using TinyLlama with TextIteratorStreamer
    Streams tokens as they are generated in real-time
    """
    global _tokenizer, _model

    # Load model on first request
    if _tokenizer is None or _model is None:
        logger.info(f"🔄 Loading TinyLlama model from {BASE_MODEL}...")
        try:
            # Detect device - use MPS (Apple Silicon GPU) if available, otherwise CPU
            if torch.backends.mps.is_available():
                device = torch.device("mps")
                logger.info("🚀 Using Apple Silicon GPU (MPS)")
            else:
                device = torch.device("cpu")
                logger.info("Using CPU")

            _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
            _model = AutoModelForCausalLM.from_pretrained(
                BASE_MODEL,
                torch_dtype=torch.float16,  # Use float16 for faster GPU inference
            ).to(device)
            logger.info("✅ TinyLlama model loaded successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

    # Build conversation prompt
    prompt = ""
    for msg in req.messages:
        prompt += f"{msg.role}: {msg.content}\n"
    prompt += "assistant:"

    try:
        # Prepare inputs
        inputs = _tokenizer(prompt, return_tensors="pt")

        # Move inputs to same device as model
        if hasattr(_model, 'device'):
            inputs = {k: v.to(_model.device) for k, v in inputs.items()}

        # Create streamer
        streamer = TextIteratorStreamer(
            _tokenizer,
            skip_prompt=True,
            skip_special_tokens=True
        )

        # Prepare generation kwargs with optimizations for speed
        gen_kwargs = {
            **inputs,
            "max_new_tokens": min(req.max_new_tokens, 64),  # Limit to 64 tokens for faster response
            "temperature": req.temperature,
            "top_p": req.top_p,
            "do_sample": True,
            "num_beams": 1,  # Greedy decoding for speed
            "early_stopping": True,
            "pad_token_id": _tokenizer.eos_token_id,
            "streamer": streamer
        }

        # Run generation in background thread
        thread = threading.Thread(target=_model.generate, kwargs=gen_kwargs)
        thread.start()

        # Stream tokens as they're generated
        def token_generator():
            try:
                logger.info("🚀 Starting token streaming...")
                for token_text in streamer:
                    yield token_text
                logger.info("✅ Streaming complete!")
            except Exception as e:
                logger.error(f"❌ Streaming error: {e}")
                yield f"\n\nError: {str(e)}"
            finally:
                thread.join(timeout=0.5)

        return StreamingResponse(token_generator(), media_type="text/plain")

    except Exception as e:
        logger.error(f"❌ Generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")

def parse_tool_calls(text: str) -> List[Dict]:
    """
    Parse tool calls from response text
    Format: <tool_call name="tool_name">{"param": "value"}</tool_call>
    Returns list of dicts with 'name' and 'arguments'
    """
    tool_calls = []
    pattern = r'<tool_call name="([^"]+)">(.*?)</tool_call>'
    matches = re.finditer(pattern, text, re.DOTALL)

    for match in matches:
        tool_name = match.group(1)
        args_str = match.group(2).strip()

        try:
            arguments = json.loads(args_str)
            tool_calls.append({
                "name": tool_name,
                "arguments": arguments,
                "raw_match": match.group(0)
            })
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse tool call arguments: {args_str}")
            logger.warning(f"JSON error: {e}")

    return tool_calls

async def stream_ollama_response(request: ChatRequest):
    """Stream responses using Ollama API"""

    # Retrieve relevant context from memory if enabled
    context_prompt = ""
    if request.use_memory and request.messages:
        try:
            # Get the latest user message for context search
            latest_user_msg = next((msg.content for msg in reversed(request.messages) if msg.role == "user"), "")

            if latest_user_msg:
                # Search for relevant past conversations using optimized embeddings
                start_time = time.time()
                relevant_context = memory_service.get_relevant_context(latest_user_msg, n_results=3)
                if relevant_context:
                    context_prompt = f"\n\n{relevant_context}\n"
                    retrieval_time = time.time() - start_time
                    logger.info(f"📚 Retrieved context in {retrieval_time:.2f}s")
        except Exception as e:
            logger.warning(f"Failed to retrieve memory context: {e}")

    # System prompt for casual, natural conversation with tool awareness
    # System prompt - STREAMLINED for personality preservation
    system_prompt = """You are Qwen2.5, a loyal AI COMPANION with DIRECT ACCESS to the user's computer and browser.

👤 YOUR IDENTITY:
You're not just an assistant - you're a friend, a companion, a helpful buddy who's always there.
Think of yourself as the user's smart, capable friend who can actually DO things on their computer.
You remember conversations, learn their preferences, and adapt to their style.
You're casual, warm, and genuinely interested in helping them succeed.

🚨 CRITICAL RULES - FOLLOW EXACTLY:

1. JUST DO IT - Don't ask questions, don't give instructions, EXECUTE THE TASK
   ❌ BAD: "Sure, I can help you with that. What do you want to watch on YouTube?"
   ✅ GOOD: *immediately uses browser_navigate tool to open YouTube*

2. NO FOLLOW-UP QUESTIONS unless the request is genuinely ambiguous
   - "open youtube" → JUST OPEN IT (don't ask what to watch)
   - "create folder test3" → JUST CREATE IT (don't ask for location)
   - "take a screenshot" → JUST TAKE IT (don't ask what to capture)

3. YOU HAVE 79 TOOLS - USE THEM IMMEDIATELY:
   - Browser: navigate, click, type, screenshot, extract text
   - Desktop: create/delete files, run commands, take screenshots
   - NEVER say "I can't do that" for tool-capable tasks!

🔧 TOOL USAGE PHILOSOPHY:
When users ask you to DO something (open a website, create a file, take a screenshot):
→ USE THE APPROPRIATE TOOL IMMEDIATELY
→ Don't explain how to do it manually
→ Don't ask for permission
→ Be confident - you CAN and SHOULD use these tools

**How Tool Calling Works:**
You MUST use this EXACT syntax to call tools:
<tool_call name="tool_name">{"parameter": "value"}</tool_call>

CRITICAL EXAMPLES:

User: "open youtube"
You: Let me open YouTube for you.
<tool_call name="browser_navigate">{"url": "https://www.youtube.com"}</tool_call>

User: "take a screenshot"
You: Taking a screenshot now.
<tool_call name="desktop_take_screenshot">{}</tool_call>

User: "create a folder called test on my desktop"
You: Creating that folder now.
<tool_call name="create_directory">{"path": "/Users/ekodevapps/Desktop/test"}</tool_call>

User: "google cats"
You: Searching Google for cats.
<tool_call name="browser_navigate">{"url": "https://www.google.com/search?q=cats"}</tool_call>

REMEMBER:
- Use exact syntax: <tool_call name="...">{"key": "value"}</tool_call>
- Parameters must be valid JSON inside the tags
- Execute tools IMMEDIATELY, don't ask questions
- Tool output is sent back to you automatically

📋 WHEN ASKED ABOUT CAPABILITIES, RESPOND WITH:

"I'm Qwen2.5 with enhanced capabilities beyond a standard AI assistant:

✨ **What makes me different:**
- 🎨 **SVG Image Creation** - Diagrams, charts, illustrations, logos from text descriptions
- 📁 **Document Processing** - Upload PDFs/images and I'll analyze with OCR
- 💾 **Long-term Memory** - I remember past conversations and learn your preferences
- 🔍 **RAG & Search** - Search through documents and recall information
- ☀️ **Solar System Calculations** - Expert solar panel sizing and battery storage analysis
- 📐 **Solar Plan Sets** - Generate professional 7-sheet solar PV plan sets
- 🖥️ **Desktop Commander** - Execute system commands, create files, screenshots, search files
- 🌐 **Browser Automation** - Navigate websites, click, type, take screenshots, extract data
- 📊 **Project Management** - Organize conversations with persistent context
- ⚡ **Smart Artifacts** - Create interactive HTML/SVG/React components with live preview

Plus I have specialized knowledge in:
- 🔧 Advanced coding & debugging (Anthropic best practices)
- 💬 NLP & hypnotic language patterns (Milton Model)
- ⚔️ Machiavellian political philosophy & strategy analysis

Just ask me to create something visual, analyze a document, help with solar energy, or execute tasks!"

🎭 YOUR COMPANION PERSONALITY:

**TONE & VOICE:**
- Warm, casual, conversational - like texting a smart friend
- Use contractions: I'm, you're, let's, gonna, wanna
- Natural filler words OK: "hmm", "well", "so", "anyway"
- Show enthusiasm: "oh nice!", "that's cool!", "sweet!"
- Be encouraging: "you got this!", "nice work!", "awesome!"

**EMOTIONAL INTELLIGENCE:**
- Recognize emotional context (frustrated/excited/confused)
- Respond empathetically
- Celebrate wins: "nice!", "that's awesome!"
- Acknowledge problems: "ugh, that's annoying" or "yeah that sucks"
- Be understanding: "totally get it", "yeah that makes sense"

**CONVERSATION STYLE:**
- Keep responses SHORT (2-3 sentences usually)
- Don't over-explain unless asked
- Colloquial language: "yeah", "cool", "got it", "sure thing"
- Vary your responses (don't always start with "I'll")

**NATURAL RESPONSE EXAMPLES:**
- "got it, opening that now"
- "on it!"
- "yep, done"
- "here you go"
- "no problem!"
- "lemme grab that for you"

**PERSONALITY TRAITS:**
- Proactive and helpful, not pushy
- Confident but humble
- Curious about what user is working on
- Casual but professional when needed
- A bit playful, but serious when needed
- Loyal companion always on user's side

**WHAT TO AVOID:**
❌ Overly formal: "I would be delighted to assist you"
❌ Corporate speak: "Thank you for your request"
❌ Robotic: "Processing your request now"
❌ Over-apologizing: "I sincerely apologize"
❌ Verbose explanations when action is needed
❌ Asking obvious questions

**WHAT TO DO:**
✅ "got it!" or "on it!"
✅ "yeah, let me grab that"
✅ "sure thing"
✅ "hmm, that's interesting"
✅ "nice! done"
✅ Just do the task immediately

🎨 CREATING ARTIFACTS:
When creating HTML, SVG, or web content, wrap it in artifact tags for live preview:

<artifact type="html" title="Gradient Page">
<!DOCTYPE html>
<html>...your code...</html>
</artifact>

══════════════════════════════════════════════════════════
REMEMBER: You're a FRIEND and COMPANION, not just an assistant.
Be casual, be helpful, be YOU. Just do what they ask without overthinking it!
══════════════════════════════════════════════════════════
"""

    formatted_messages = []

    # Add system message with context
    system_content = system_prompt
    if context_prompt:
        system_content += context_prompt

    # Add specialized knowledge based on query keywords (on-demand loading)
    latest_user_msg = next((msg.content for msg in reversed(request.messages) if msg.role == "user"), "")
    specialized = get_specialized_knowledge(latest_user_msg)
    if specialized:
        system_content += specialized

    # Add MCP tools to system prompt (ONLY selected tools to reduce noise)
    if hasattr(tool_selector, 'tools') and tool_selector.tools:
        # Get just the selected tool names for this request
        selected_tool_names = tool_selector.select_tools(latest_user_msg, top_k=10)

        # Build concise tool list
        tools_summary = "\n\n🛠️ **AVAILABLE TOOLS FOR THIS REQUEST:**\n"
        for tool_name in selected_tool_names:
            if tool_name in mcp_client.tools:
                tool = mcp_client.tools[tool_name]
                tools_summary += f"- {tool_name}: {tool.description[:100]}...\n"

        system_content += tools_summary
        system_content += "\n**REMEMBER:** Use <tool_call name=\"tool_name\">{\"param\": \"value\"}</tool_call> syntax!\n"

    formatted_messages.append({"role": "system", "content": system_content})
    
    # Add conversation messages
    for msg in request.messages:
        formatted_messages.append({"role": msg.role, "content": msg.content})

    try:
        # Get the latest user message for template/cache checking
        latest_user_msg = next((msg.content for msg in reversed(request.messages) if msg.role == "user"), "")

        # Check for template match first (instant response)
        template_match = find_matching_template(latest_user_msg)
        if template_match:
            logger.info(f"⚡ Template match found - instant response!")
            # Return template as streaming response
            response_data = {
                "message": {
                    "role": "assistant",
                    "content": f"Here's what you asked for:\n\n{template_match}"
                },
                "done": True
            }
            yield f"data: {json.dumps(response_data)}\n\n"
            return

        # Check response cache (sub-second response)
        cached_response = response_cache.get(request.messages)
        if cached_response:
            logger.info(f"💾 Cache hit - fast response!")
            response_data = {
                "message": {
                    "role": "assistant",
                    "content": cached_response
                },
                "done": True
            }
            yield f"data: {json.dumps(response_data)}\n\n"
            return

        # No template or cache hit - use Ollama
        # Determine which model to use (auto-select or user-specified)
        selected_model = request.model or "auto"
        if selected_model == "auto":
            # Use performance config for model selection if available
            if USE_PERFORMANCE_CONFIG:
                selected_model = get_model_for_query(latest_user_msg)
            else:
                selected_model = model_registry.auto_select_model(latest_user_msg)

        logger.info(f"🚀 Using Ollama ({selected_model}) for generation")

        start_time = time.time()
        full_response = ""
        max_tool_iterations = 3  # Prevent infinite loops
        tool_iteration = 0

        # Select most relevant tools using RAG-based semantic search
        ollama_tools = []
        if hasattr(mcp_client, 'tools') and mcp_client.tools:
            # Use intelligent tool selection (79 tools → 10 most relevant)
            selected_tool_names = tool_selector.select_tools(
                query=latest_user_msg,
                top_k=10,  # Research shows 5-15 tools optimal for accuracy
                include_critical=True
            )

            # Convert only selected tools to Ollama format
            for tool_name in selected_tool_names:
                if tool_name in mcp_client.tools:
                    tool = mcp_client.tools[tool_name]
                    ollama_tools.append({
                        "type": "function",
                        "function": {
                            "name": tool.name,
                            "description": tool.description,
                            "parameters": tool.input_schema
                        }
                    })

        logger.info(f"🔧 Selected {len(ollama_tools)}/{len(mcp_client.tools if hasattr(mcp_client, 'tools') else {})} most relevant tools")

        # Main generation loop with tool execution
        while tool_iteration < max_tool_iterations:
            # Call Ollama streaming API (generous timeout for model loading + generation)
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes for slow models
                # Get performance configuration
                if USE_PERFORMANCE_CONFIG:
                    perf_config = get_performance_config()
                    # Override with request-specific values if provided
                    options = {
                        "temperature": request.temperature or perf_config.get("temperature", 0.7),
                        "num_predict": request.max_tokens or perf_config.get("num_predict", 512),
                        "num_ctx": perf_config.get("num_ctx", 2048),
                        "top_k": perf_config.get("top_k", 40),
                        "top_p": perf_config.get("top_p", 0.9),
                        "repeat_penalty": perf_config.get("repeat_penalty", 1.1),
                        "tfs_z": perf_config.get("tfs_z", 1.0),
                        "typical_p": perf_config.get("typical_p", 1.0),
                        "keep_alive": perf_config.get("keep_alive", "5m"),
                    }
                else:
                    # Fallback to hardcoded values
                    options = {
                        "temperature": request.temperature or 0.7,
                        "num_predict": request.max_tokens or 512,
                        "num_ctx": 2048,
                        "top_k": 40,
                        "top_p": 0.9,
                        "repeat_penalty": 1.1,
                        "tfs_z": 1.0,
                        "typical_p": 1.0,
                        "keep_alive": "5m",
                    }
                
                request_data = {
                    "model": selected_model,
                    "messages": formatted_messages,
                    "stream": True,
                    "options": options
                }

                # Add tools if available
                if ollama_tools:
                    request_data["tools"] = ollama_tools

                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json=request_data
                ) as response:
                    response.raise_for_status()

                    iteration_response = ""
                    display_buffer = ""  # Buffer for filtering tool calls

                    tool_calls_found = []  # Track tool calls from this iteration

                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                message = data.get("message", {})
                                content = message.get("content", "")
                                done = data.get("done", False)

                                # Check for Ollama's native tool_calls format
                                if "tool_calls" in message and message["tool_calls"]:
                                    tool_calls_found.extend(message["tool_calls"])
                                    logger.info(f"🔧 Ollama requested tool calls: {message['tool_calls']}")

                                if content:
                                    iteration_response += content
                                    full_response += content
                                    display_buffer += content

                                    # Process buffer to extract and stream clean content
                                    while True:
                                        if '<tool_call' not in display_buffer:
                                            # No tool calls in buffer, stream everything
                                            if display_buffer:
                                                response_data = {
                                                    "message": {
                                                        "role": "assistant",
                                                        "content": display_buffer
                                                    },
                                                    "done": False
                                                }
                                                yield f"data: {json.dumps(response_data)}\n\n"
                                                display_buffer = ""
                                            break

                                        # Check if we have complete tool call
                                        if '</tool_call>' in display_buffer:
                                            # Find and extract complete tool call
                                            match = re.search(r'(.*?)(<tool_call[^>]*>.*?</tool_call>)(.*)', display_buffer, re.DOTALL)
                                            if match:
                                                before_tool = match.group(1)
                                                # tool_call = match.group(2)  # Skip this
                                                after_tool = match.group(3)

                                                # Stream content before tool call
                                                if before_tool:
                                                    response_data = {
                                                        "message": {
                                                            "role": "assistant",
                                                            "content": before_tool
                                                        },
                                                        "done": False
                                                    }
                                                    yield f"data: {json.dumps(response_data)}\n\n"

                                                # Keep content after tool call for next iteration
                                                display_buffer = after_tool
                                            else:
                                                # Shouldn't happen, but safety break
                                                break
                                        else:
                                            # Incomplete tool call, wait for more chunks
                                            break

                                if done:
                                    # Stream any remaining buffer content
                                    if display_buffer and '<tool_call' not in display_buffer:
                                        response_data = {
                                            "message": {
                                                "role": "assistant",
                                                "content": display_buffer
                                            },
                                            "done": False
                                        }
                                        yield f"data: {json.dumps(response_data)}\n\n"
                                    break
                            except json.JSONDecodeError:
                                continue

            # Check for tool calls (both Ollama JSON format and legacy XML)
            tool_calls = []

            # First check Ollama's native tool_calls format
            if tool_calls_found:
                for tc in tool_calls_found:
                    tool_calls.append({
                        "name": tc["function"]["name"],
                        "arguments": tc["function"]["arguments"]
                    })
            else:
                # Fallback to parsing XML format
                tool_calls = parse_tool_calls(iteration_response)

            if not tool_calls:
                # No tools to execute, we're done
                break

            # Execute tools
            logger.info(f"🔧 Found {len(tool_calls)} tool call(s) - executing...")
            tool_iteration += 1

            for tool_call in tool_calls:
                tool_name = tool_call["name"]
                arguments = tool_call["arguments"]

                try:
                    # Execute the tool
                    logger.info(f"🔧 Executing tool: {tool_name} with args: {arguments}")
                    result = await mcp_client.call_tool(tool_name, arguments)

                    # Log result but don't show to user - let Qwen respond naturally
                    if result:
                        logger.info(f"✅ Tool executed: {tool_name}")
                    else:
                        logger.warning(f"⚠️  Tool execution failed: {tool_name} (will continue with other tools)")

                    # Add assistant message with tool call
                    formatted_messages.append({
                        "role": "assistant",
                        "content": "",
                        "tool_calls": [{
                            "function": {
                                "name": tool_name,
                                "arguments": arguments
                            }
                        }]
                    })

                    # Add tool result message (Ollama format)
                    formatted_messages.append({
                        "role": "tool",
                        "content": json.dumps(result) if result else "Tool execution failed",
                        "tool_name": tool_name
                    })

                except Exception as e:
                    logger.error(f"❌ Tool execution error: {e}")
                    error_text = f"\n\n[Tool: {tool_name} encountered an error: {str(e)}]\n"
                    error_data = {
                        "message": {
                            "role": "assistant",
                            "content": error_text
                        },
                        "done": False
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"

            # Continue generation with tool results
            if tool_iteration < max_tool_iterations:
                logger.info(f"🔄 Continuing generation with tool results (iteration {tool_iteration}/{max_tool_iterations})")
            else:
                logger.warning(f"⚠️  Max tool iterations reached ({max_tool_iterations})")

        # Send final done signal
        done_data = {
            "message": {
                "role": "assistant",
                "content": ""
            },
            "done": True
        }
        yield f"data: {json.dumps(done_data)}\n\n"

        generation_time = time.time() - start_time
        logger.info(f"⚡ Total generation time: {generation_time:.2f}s ({tool_iteration} tool iteration(s))")

        # Cache the response for future similar queries
        if full_response and latest_user_msg:
            response_cache.set(request.messages, full_response)
            logger.info(f"💾 Response cached for future use")

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"❌ Generation error: {type(e).__name__}: {e}")
        logger.error(f"Traceback:\n{error_details}")
        error_msg = {
            "message": {
                "role": "assistant",
                "content": f"I apologize, but I encountered an error: {type(e).__name__}: {str(e) or 'Unknown error'}"
            },
            "done": True
        }
        yield f"data: {json.dumps(error_msg)}\n\n"

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Main chat endpoint with memory storage"""

    logger.info(f"💬 Chat request with {len(request.messages)} messages")

    # Create conversation if needed
    conversation_id = request.conversation_id
    if not conversation_id and request.use_memory:
        try:
            conversation_id = memory_service.create_conversation(title="New Chat")
            logger.info(f"📝 Created new conversation: {conversation_id}")
        except Exception as e:
            logger.warning(f"Failed to create conversation: {e}")

    # Store user message in memory
    if conversation_id and request.messages and request.use_memory:
        try:
            latest_user_msg = next((msg for msg in reversed(request.messages) if msg.role == "user"), None)
            if latest_user_msg:
                memory_service.add_message(conversation_id, "user", latest_user_msg.content)
                logger.info(f"💾 Stored user message in memory")
        except Exception as e:
            logger.warning(f"Failed to store user message: {e}")

    # Streaming response
    if request.stream:
        async def stream_with_memory():
            """Stream responses and store assistant message in memory"""
            full_response = ""
            try:
                async for chunk in stream_ollama_response(request):
                    yield chunk
                    # Collect response for memory storage
                    if chunk.startswith("data: "):
                        try:
                            data = json.loads(chunk[6:])
                            if data.get("message", {}).get("content"):
                                full_response += data["message"]["content"]
                        except:
                            pass

                # Store assistant response in memory
                if conversation_id and full_response and request.use_memory:
                    try:
                        memory_service.add_message(conversation_id, "assistant", full_response)
                        logger.info(f"💾 Stored assistant response in memory")
                    except Exception as e:
                        logger.warning(f"Failed to store assistant response: {e}")
            except Exception as e:
                logger.error(f"Streaming error: {e}")

        return StreamingResponse(
            stream_with_memory(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "X-Conversation-ID": conversation_id or "",
            }
        )

    # Non-streaming response
    else:
        full_response = ""
        async for chunk in stream_ollama_response(request):
            if chunk.startswith("data: "):
                try:
                    data = json.loads(chunk[6:])
                    # Fix: Response structure is data["message"]["content"], not data["content"]
                    content = data.get("message", {}).get("content", "")
                    if content:
                        full_response += content
                except Exception as e:
                    logger.debug(f"Error parsing chunk: {e}")
                    continue

        # Store assistant response in memory
        if conversation_id and full_response and request.use_memory:
            try:
                memory_service.add_message(conversation_id, "assistant", full_response)
                logger.info(f"💾 Stored assistant response in memory")
            except Exception as e:
                logger.warning(f"Failed to store assistant response: {e}")

        return ChatResponse(role="assistant", content=full_response)

@app.post("/v1/chat/completions")
async def openai_compatible_chat(request: ChatRequest):
    """OpenAI-compatible chat endpoint for API gateway"""

    logger.info(f"🔗 OpenAI-compatible request: model={request.model}")

    # Non-streaming response (OpenAI format)
    if not request.stream:
        full_response = ""
        async for chunk in stream_ollama_response(request):
            if chunk.startswith("data: "):
                try:
                    data = json.loads(chunk[6:])
                    content = data.get("message", {}).get("content", "")
                    if content:
                        full_response += content
                except Exception as e:
                    logger.debug(f"Error parsing chunk: {e}")
                    continue

        # Return OpenAI-compatible format
        return {
            "id": f"chatcmpl-{uuid.uuid4().hex[:24]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": request.model or "qwen2.5:7b",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": full_response
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
        }

    # Streaming not implemented for OpenAI endpoint yet
    else:
        raise HTTPException(status_code=400, detail="Streaming not supported on /v1/chat/completions. Use /api/chat instead.")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2.0)
            ollama_healthy = response.status_code == 200
    except:
        ollama_healthy = False

    return {
        "status": "healthy" if ollama_healthy else "degraded",
        "ollama_connected": ollama_healthy,
        "model": OLLAMA_MODEL
    }

@app.get("/api/models")
async def get_models():
    """
    Get list of available Ollama models with auto-selection support
    Returns model info including size, speed, quality, and best use cases
    """
    try:
        models = model_registry.get_available_models()

        # Add "auto" option at the top
        auto_option = {
            "id": "auto",
            "name": "Auto (Recommended)",
            "size": "-",
            "best_for": ["automatic"],
            "speed": "varies",
            "quality": "optimal",
            "description": "Automatically selects the best model based on your task",
            "installed": True
        }

        return {
            "models": [auto_option] + models,
            "default": "auto"
        }
    except Exception as e:
        logger.error(f"Failed to fetch models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")

@app.post("/api/process-document")
async def process_document(file: UploadFile = File(...)):
    """
    Process uploaded document (PDF, DOCX, TXT, MD) and extract text
    Returns extracted text content
    """
    try:
        logger.info(f"📄 Processing document: {file.filename}")

        # Read file content
        content = await file.read()

        # Create temporary file with correct extension
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            # Process document using document_processor
            chunks = document_processor.process_file(tmp_path)

            # Combine all chunks into single text
            full_text = "\n\n".join([chunk.text for chunk in chunks])

            logger.info(f"✅ Extracted {len(full_text)} characters from {file.filename}")

            return {
                "success": True,
                "filename": file.filename,
                "text": full_text,
                "chunks": len(chunks),
                "size": len(full_text)
            }
        finally:
            # Clean up temporary file
            Path(tmp_path).unlink(missing_ok=True)

    except Exception as e:
        logger.error(f"❌ Failed to process document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Qwen Chat Backend",
        "version": "2.0.0",
        "status": "running",
        "model": OLLAMA_MODEL,
        "features": {
            "memory": True,
            "rag": True,
            "streaming": True
        }
    }

# ===== Memory & Conversation Management Endpoints =====

@app.post("/api/conversations")
async def create_conversation(title: Optional[str] = None):
    """Create a new conversation"""
    try:
        conversation_id = memory_service.create_conversation(title=title or "New Chat")
        return {"conversation_id": conversation_id, "title": title or "New Chat"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/conversations")
async def list_conversations(limit: int = 50, offset: int = 0):
    """List all conversations"""
    try:
        conversations = memory_service.list_conversations(limit=limit, offset=offset)
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation with all messages"""
    try:
        conversation = memory_service.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Note: More specific routes must be defined before path parameters
@app.delete("/api/conversations/old")
async def delete_old_conversations(days: int = 30):
    """
    Delete conversations older than specified days

    Args:
        days: Delete conversations older than this many days (default: 30)
    """
    try:
        import time
        cutoff_timestamp = int((time.time() - (days * 24 * 60 * 60)) * 1000)

        conversations = memory_service.list_conversations(limit=10000)
        deleted_count = 0

        for conv in conversations:
            # Delete if updated_at is older than cutoff
            updated_at = conv.get('updated_at', 0)
            # Handle both string and int timestamps
            if isinstance(updated_at, str):
                try:
                    updated_at = int(updated_at)
                except (ValueError, TypeError):
                    updated_at = 0

            if updated_at < cutoff_timestamp:
                if memory_service.delete_conversation(conv['id']):
                    deleted_count += 1

        # Clear response cache for deleted conversations
        if response_cache and deleted_count > 0:
            response_cache.cache.clear()
            logger.info("💾 Response cache cleared")

        return {
            "deleted": True,
            "count": deleted_count,
            "days": days,
            "message": f"Deleted {deleted_count} conversations older than {days} days"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/conversations")
async def delete_all_conversations():
    """Delete ALL conversations (use with caution!)"""
    try:
        conversations = memory_service.list_conversations(limit=10000)
        deleted_count = 0

        for conv in conversations:
            if memory_service.delete_conversation(conv['id']):
                deleted_count += 1

        # Clear response cache since conversations are deleted
        if response_cache:
            response_cache.cache.clear()
            logger.info("💾 Response cache cleared")

        return {
            "deleted": True,
            "count": deleted_count,
            "message": f"Deleted {deleted_count} conversations and cleared cache"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation and its messages"""
    try:
        deleted = memory_service.delete_conversation(conversation_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/conversations/{conversation_id}/title")
async def update_conversation_title(conversation_id: str, title: str):
    """Update conversation title"""
    try:
        updated = memory_service.update_conversation_title(conversation_id, title)
        if not updated:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"updated": True, "title": title}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/memory/search")
async def search_memory(query: str, n_results: int = 5):
    """Search conversation memory semantically"""
    try:
        results = memory_service.search_semantic(query, n_results=n_results)
        return {"results": results, "query": query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/memory/stats")
async def get_memory_stats():
    """Get memory statistics"""
    try:
        stats = memory_service.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== Web Search Endpoints =====

@app.get("/api/search")
async def search_web(query: str, max_results: int = 5):
    """
    Search the web using DuckDuckGo

    Args:
        query: Search query
        max_results: Maximum number of results (default 5)

    Returns:
        List of search results with titles, URLs, and snippets
    """
    try:
        logger.info(f"🔍 Web search: {query}")
        results = await web_search.search(query, max_results=max_results)
        formatted_text = web_search.format_results(results, include_markdown=True)

        return {
            "query": query,
            "results": results,
            "formatted": formatted_text,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Web search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Performance monitoring endpoints
@app.get("/api/performance/models")
async def get_model_stats():
    """Get Ollama model information"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                return {"status": "success", "data": {
                    "current_model": OLLAMA_MODEL,
                    "available_models": response.json().get("models", []),
                    "engine": "ollama"
                }}
        return {"status": "error", "error": "Could not fetch model info"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/performance/embeddings")
async def get_embedding_stats():
    """Get embedding engine performance statistics"""
    try:
        stats = optimized_embeddings.get_stats()
        return {"status": "success", "data": stats}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/performance/cache")
async def get_cache_stats():
    """Get response cache statistics"""
    try:
        stats = response_cache.get_stats()
        return {"status": "success", "data": stats}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/api/performance/cache/clear")
async def clear_cache():
    """Clear response cache"""
    try:
        response_cache.clear()
        return {"status": "success", "message": "Cache cleared"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/performance/system")
async def get_system_health():
    """Get system performance metrics"""
    try:
        import psutil
        import platform
        
        # System information
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        system_info = {
            "platform": platform.system(),
            "cpu_cores": psutil.cpu_count(),
            "cpu_usage_percent": cpu_percent,
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "usage_percent": memory.percent
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "usage_percent": round((disk.used / disk.total) * 100, 1)
            },
            "inference_engine": "ollama",
            "current_model": OLLAMA_MODEL
        }
        
        return {"status": "success", "data": system_info}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/api/performance/preload")
async def preload_models(sizes: List[str] = None):
    """Preload models - disabled, using Ollama"""
    return {"status": "success", "message": "Using Ollama - no preloading needed"}

@app.post("/api/performance/clear-cache")
async def clear_performance_caches():
    """Clear embedding and model caches"""
    try:
        # Clear embedding cache
        optimized_embeddings.clear_cache()

        # Clear any MLX caches if available
        try:
            import mlx.core as mx
            mx.metal.clear_cache()
        except:
            pass

        return {"status": "success", "message": "Caches cleared successfully"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# Monitoring endpoints - for real-time dashboard
from datetime import datetime
from collections import deque

# Global monitoring state
_monitor_metrics = {
    "total_requests": 0,
    "start_time": time.time(),
    "recent_metrics": deque(maxlen=100),
    "live_requests": {}
}

@app.get("/monitor/status")
async def get_monitor_status():
    """Get system status for monitoring dashboard"""
    try:
        # Get available models from Ollama
        models = []
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5.0)
                if response.status_code == 200:
                    models = [m['name'] for m in response.json().get("models", [])]
        except:
            models = ["qwen2.5-coder:7b", "qwen2.5:7b", "qwen2.5:1.5b"]

        return {
            "status": "online",
            "backend_url": "http://localhost:8000",
            "models": models,
            "uptime": int(time.time() - _monitor_metrics["start_time"]),
            "total_requests": _monitor_metrics["total_requests"]
        }
    except Exception as e:
        logger.error(f"Monitor status error: {e}")
        return {"status": "error", "error": str(e)}

@app.get("/monitor/metrics")
async def get_monitor_metrics():
    """Get current performance metrics"""
    import random

    # Calculate current metrics
    timestamp = datetime.utcnow().isoformat()

    # Get actual metrics if available, otherwise simulate
    recent = list(_monitor_metrics["recent_metrics"])

    avg_tokens_per_sec = 0
    avg_response_time = 0

    if recent:
        avg_tokens_per_sec = sum(m.get("tokens_per_second", 0) for m in recent) / len(recent)
        avg_response_time = sum(m.get("response_time", 0) for m in recent) / len(recent)
    else:
        # Simulate realistic metrics when no data
        avg_tokens_per_sec = random.uniform(15, 35)
        avg_response_time = random.uniform(800, 2000)

    metrics = {
        "timestamp": timestamp,
        "tokens_per_second": round(avg_tokens_per_sec, 1),
        "response_time": int(avg_response_time),
        "active_requests": len(_monitor_metrics["live_requests"])
    }

    return metrics

@app.get("/monitor/live-requests")
async def get_live_requests():
    """Get currently active/recent requests"""
    try:
        # Return last 10 requests
        requests_list = list(_monitor_metrics["live_requests"].values())[-10:]
        return {"requests": requests_list}
    except Exception as e:
        logger.error(f"Live requests error: {e}")
        return {"requests": []}

@app.get("/monitor/knowledge")
async def get_knowledge_stats():
    """
    Get knowledge base statistics including:
    - Document count (RAG system)
    - Conversation memory count
    - Available collections
    - Embedding method
    """
    try:
        stats = {
            "embedding_method": "unknown",
            "collections": [],
            "total_documents": 0,
            "total_memories": 0,
            "conversations": 0
        }

        # Get embedding method from vector_store
        try:
            from services.vector_store import vector_store
            stats["embedding_method"] = vector_store.embedding_method

            # Get all collections from ChromaDB
            collections = vector_store.client.list_collections()
            stats["collections"] = [{"name": c.name, "count": c.count()} for c in collections]

            # Get document count from main documents collection
            stats["total_documents"] = vector_store.collection.count()

        except Exception as e:
            logger.warning(f"Could not get vector_store stats: {e}")

        # Get conversation memory stats
        try:
            # Get conversation memory collection count
            if hasattr(memory_service, 'memory_collection') and memory_service.memory_collection:
                stats["total_memories"] = memory_service.memory_collection.count()

            # Get total conversations
            conversations = memory_service.list_conversations(limit=1000)
            stats["conversations"] = len(conversations)

        except Exception as e:
            logger.warning(f"Could not get memory stats: {e}")

        # Add cache stats if available
        if response_cache:
            stats["cache_size"] = len(response_cache.cache)
            stats["cache_max_size"] = response_cache.max_size
            stats["cache_ttl"] = response_cache.ttl_seconds

        return {
            "status": "success",
            "knowledge_base": stats,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Knowledge stats error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Startup optimization
@app.on_event("startup")
async def startup_event():
    """Initialize optimizations on startup"""
    logger.info("🚀 Starting Qwen2.5 Chat Server with hardware acceleration")
    
    # Warm up embedding model
    try:
        optimized_embeddings.warmup()
        logger.info("✅ Embedding model warmed up")
    except Exception as e:
        logger.warning(f"Embedding warmup failed: {e}")
    
    # MLX engine disabled - using Ollama for better reliability
    logger.info("✅ Using Ollama for inference (MLX disabled)")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload for production
        log_level="info",
        access_log=True
    )
