"""
Performance Configuration for Qwen Chat Backend
Easily tune model performance parameters here
"""

from typing import Dict, Any

# ===== Model Performance Settings =====

# Context window size (tokens)
# Lower = faster, less memory, shorter conversation history
# Higher = slower, more memory, longer conversation history
CONTEXT_WINDOW = 2048  # Options: 1024, 2048, 4096, 8192

# Maximum tokens to generate per response
# Lower = faster responses, shorter answers
# Higher = slower responses, longer answers
MAX_TOKENS_DEFAULT = 512  # Options: 128, 256, 512, 1024, 2048

# Temperature (creativity/randomness)
# Lower = more deterministic, faster
# Higher = more creative, slower
TEMPERATURE_DEFAULT = 0.7  # Range: 0.0 - 2.0

# ===== Generation Speed Optimizations =====

# Top-K sampling: limit candidate tokens
# Lower = faster, less diverse
# Higher = slower, more diverse
TOP_K = 40  # Options: 20, 40, 60, 80

# Top-P (nucleus sampling): cumulative probability threshold
# Lower = faster, more focused
# Higher = slower, more diverse
TOP_P = 0.9  # Range: 0.0 - 1.0

# Repeat penalty: prevent repetition
# Lower = faster, may repeat
# Higher = slower, less repetition
REPEAT_PENALTY = 1.1  # Range: 1.0 - 1.5

# Tail-free sampling (TFS): faster generation
# 1.0 = enabled (faster), 0.0 = disabled
TFS_Z = 1.0  # Range: 0.0 - 1.0

# Typical sampling: faster generation
# 1.0 = enabled (faster), 0.0 = disabled
TYPICAL_P = 1.0  # Range: 0.0 - 1.0

# ===== Model Preloading =====

# Keep model in memory between requests
# Format: "5m" (5 minutes), "10m", "30m", "1h", or "-1" (forever)
KEEP_ALIVE = "5m"  # Options: "1m", "5m", "10m", "30m", "1h", "-1"

# Preload model on startup (requires model to be loaded)
PRELOAD_ON_STARTUP = True  # True/False

# ===== Model Selection =====

# Default model for general queries
DEFAULT_MODEL = "qwen2.5-coder:7b"

# Fast model for simple queries (smaller, faster)
FAST_MODEL = "qwen2.5:1.5b"  # 986 MB vs 4.7 GB

# Simple query keywords (use fast model for these)
SIMPLE_QUERY_KEYWORDS = [
    'hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay',
    'yes', 'no', 'help', 'bye', 'goodbye', 'what', 'who', 'when', 'where'
]

# ===== Performance Profiles =====

# Predefined performance profiles
PERFORMANCE_PROFILES = {
    "fast": {
        "context_window": 1024,
        "max_tokens": 256,
        "temperature": 0.7,
        "top_k": 20,
        "top_p": 0.8,
        "keep_alive": "10m",
        "description": "Fastest responses, shorter context"
    },
    "balanced": {
        "context_window": 2048,
        "max_tokens": 512,
        "temperature": 0.7,
        "top_k": 40,
        "top_p": 0.9,
        "keep_alive": "5m",
        "description": "Balanced speed and quality (recommended)"
    },
    "quality": {
        "context_window": 4096,
        "max_tokens": 1024,
        "temperature": 0.8,
        "top_k": 60,
        "top_p": 0.95,
        "keep_alive": "5m",
        "description": "Higher quality, longer responses"
    }
}

# Current active profile
ACTIVE_PROFILE = "balanced"  # Options: "fast", "balanced", "quality"

# ===== Helper Functions =====

def get_performance_config() -> Dict[str, Any]:
    """
    Get current performance configuration based on active profile
    
    Returns:
        Dictionary with all performance settings
    """
    if ACTIVE_PROFILE in PERFORMANCE_PROFILES:
        profile = PERFORMANCE_PROFILES[ACTIVE_PROFILE]
        return {
            "num_ctx": profile["context_window"],
            "num_predict": profile["max_tokens"],
            "temperature": profile["temperature"],
            "top_k": profile["top_k"],
            "top_p": profile["top_p"],
            "repeat_penalty": REPEAT_PENALTY,
            "tfs_z": TFS_Z,
            "typical_p": TYPICAL_P,
            "keep_alive": profile["keep_alive"],
        }
    
    # Fallback to individual settings
    return {
        "num_ctx": CONTEXT_WINDOW,
        "num_predict": MAX_TOKENS_DEFAULT,
        "temperature": TEMPERATURE_DEFAULT,
        "top_k": TOP_K,
        "top_p": TOP_P,
        "repeat_penalty": REPEAT_PENALTY,
        "tfs_z": TFS_Z,
        "typical_p": TYPICAL_P,
        "keep_alive": KEEP_ALIVE,
    }

def should_use_fast_model(query: str) -> bool:
    """
    Determine if a simple query should use the fast model
    
    Args:
        query: User query text
        
    Returns:
        True if should use fast model, False otherwise
    """
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in SIMPLE_QUERY_KEYWORDS)

def get_model_for_query(query: str) -> str:
    """
    Select appropriate model based on query complexity
    
    Args:
        query: User query text
        
    Returns:
        Model name to use
    """
    if should_use_fast_model(query):
        return FAST_MODEL
    return DEFAULT_MODEL

# ===== Configuration Info =====

def print_config_info():
    """Print current configuration for debugging"""
    config = get_performance_config()
    profile_info = PERFORMANCE_PROFILES.get(ACTIVE_PROFILE, {})
    
    print("=" * 60)
    print("Qwen Chat Performance Configuration")
    print("=" * 60)
    print(f"Active Profile: {ACTIVE_PROFILE}")
    if profile_info:
        print(f"Description: {profile_info.get('description', 'N/A')}")
    print()
    print("Current Settings:")
    for key, value in config.items():
        print(f"  {key}: {value}")
    print()
    print("Available Profiles:")
    for name, profile in PERFORMANCE_PROFILES.items():
        marker = " ← ACTIVE" if name == ACTIVE_PROFILE else ""
        print(f"  {name}: {profile['description']}{marker}")
    print("=" * 60)

if __name__ == "__main__":
    print_config_info()

