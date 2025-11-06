'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Loader2, Plus, Settings, Trash2, MessageSquare, MoreHorizontal, User, FolderPlus, Server, Moon, Sun, Menu } from 'lucide-react';
import type { Message, Conversation, ModelSettings, AttachedFile, Project } from '@/types/chat';
import { sendMessage, fileToBase64, createAttachedFile, processDocument } from '@/lib/qwen-api';
import { sendMessageWithTinyLlama } from '@/lib/llmStream';
import { storage } from '@/lib/storage';
import { SettingsDialog } from './settings-dialog';
import { ProjectSettingsDialog } from './project-settings-dialog';
import { CreateProjectDialog } from './create-project-dialog';
import { MCPServersDialog } from './mcp-servers-dialog';
import type { MCPServer } from '@/types/mcp';
import { DEFAULT_MCP_SERVERS } from '@/lib/defaults';
import { MarkdownMessage } from './markdown-message';
import { ArtifactPreview } from './artifact-preview';
import type { Artifact } from '@/types/artifact';
import { parseArtifacts, stripArtifactTags } from '@/lib/artifact-parser';
import { ServerStatus } from './server-status';

export function ChatInterface() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ModelSettings>(storage.getSettings());
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [showBottomMenu, setShowBottomMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [useTinyLlama, setUseTinyLlama] = useState(false); // Default to Ollama (better responses)
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [showArtifactPanel, setShowArtifactPanel] = useState(false);
  const [artifactPanelWidth, setArtifactPanelWidth] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const [showBrowserMode, setShowBrowserMode] = useState(false);
  const [browserUrl, setBrowserUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Load projects and conversations on mount
  useEffect(() => {
    try {
      const savedProjects = storage.getProjects() || [];
      const savedConvs = storage.getConversations() || [];
      setProjects(savedProjects);
      setConversations(savedConvs);

      const currentId = storage.getCurrentConversationId();
      if (currentId && savedConvs.find((c) => c.id === currentId)) {
        setCurrentConversationId(currentId);
        const conv = savedConvs.find((c) => c.id === currentId);
        if (conv?.projectId) {
          setCurrentProjectId(conv.projectId);
          setExpandedProjects(new Set([conv.projectId]));
        }
      } else if (savedConvs.length > 0) {
        setCurrentConversationId(savedConvs[0].id);
        storage.setCurrentConversationId(savedConvs[0].id);
      }

      // Load MCP servers (with defaults if empty)
      const savedServers = storage.getMCPServers() || [];
      setMcpServers(savedServers.length > 0 ? savedServers : DEFAULT_MCP_SERVERS);
      if (savedServers.length === 0) {
        storage.saveMCPServers(DEFAULT_MCP_SERVERS);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Set safe defaults
      setProjects([]);
      setConversations([]);
      setMcpServers(DEFAULT_MCP_SERVERS);
    }
  }, []);

  // Refresh projects when window regains focus (to catch updates from project page)
  useEffect(() => {
    const handleFocus = () => {
      try {
        const savedProjects = storage.getProjects() || [];
        setProjects(savedProjects);
      } catch (error) {
        console.error('Error refreshing projects:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Throttled auto-scroll to bottom - only when not actively streaming
  useEffect(() => {
    if (!isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages?.length, isLoading]);

  // Set mounted state FIRST - critical for preventing loading screen stuck
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dark mode initialization - client-side only to prevent hydration errors
  useEffect(() => {
    try {
      // Load dark mode preference from localStorage
      const savedDarkMode = localStorage.getItem('darkMode');
      const prefersDark = savedDarkMode ? JSON.parse(savedDarkMode) :
                         window.matchMedia('(prefers-color-scheme: dark)').matches;

      setIsDarkMode(prefersDark);

      // Apply dark mode to document
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error initializing dark mode:', error);
      // Fallback to light mode on error
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Apply dark mode changes to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleCreateProject = (project: Project) => {
    setProjects([project, ...projects]);
    setCurrentProjectId(project.id);
    setExpandedProjects(new Set([...expandedProjects, project.id]));
    storage.saveProject(project);
  };

  const deleteProject = (id: string) => {
    // Delete all conversations in this project
    const projectConvs = conversations.filter((c) => c.projectId === id);
    projectConvs.forEach((conv) => {
      storage.deleteConversation(conv.id);
    });

    // Delete the project
    storage.deleteProject(id);
    const filtered = projects.filter((p) => p.id !== id);
    setProjects(filtered);

    // Update conversations state
    const filteredConvs = conversations.filter((c) => c.projectId !== id);
    setConversations(filteredConvs);

    // Update current states if needed
    if (currentProjectId === id) {
      setCurrentProjectId(null);
      if (currentConversationId && projectConvs.find((c) => c.id === currentConversationId)) {
        setCurrentConversationId(filteredConvs[0]?.id || null);
        if (filteredConvs[0]) {
          storage.setCurrentConversationId(filteredConvs[0].id);
        }
      }
    }
    setExpandedProjects(new Set([...expandedProjects].filter((pid) => pid !== id)));
  };

  const createNewConversation = (projectId?: string) => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      projectId: projectId || currentProjectId || undefined,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations([newConv, ...conversations]);
    setCurrentConversationId(newConv.id);
    storage.saveConversation(newConv);
    storage.setCurrentConversationId(newConv.id);

    // Clear input and attached files for fresh start
    setInput('');
    setAttachedFiles([]);

    // Add to project if applicable
    if (newConv.projectId) {
      const project = projects.find((p) => p.id === newConv.projectId);
      if (project) {
        const updatedProject = {
          ...project,
          conversations: [newConv.id, ...project.conversations],
          updatedAt: Date.now(),
        };
        setProjects(projects.map((p) => (p.id === project.id ? updatedProject : p)));
        storage.saveProject(updatedProject);
      }
    }
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    let conversation = currentConversation;
    if (!conversation) {
      const newConv: Conversation = {
        id: crypto.randomUUID(),
        projectId: currentProjectId || undefined,
        title: input.slice(0, 50),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      conversation = newConv;
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    const updatedMessages = [...conversation.messages, userMessage];
    const updatedConv = {
      ...conversation,
      messages: updatedMessages,
      updatedAt: Date.now(),
      title: conversation.messages.length === 0 ? input.slice(0, 50) : conversation.title,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    );
    storage.saveConversation(updatedConv);
    storage.setCurrentConversationId(updatedConv.id);

    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      // Choose backend based on useTinyLlama state
      const sendFn = useTinyLlama ? sendMessageWithTinyLlama : sendMessage;

      // Throttle updates during streaming to improve performance
      let updateCounter = 0;
      const UPDATE_FREQUENCY = 5; // Update UI every 5 chunks instead of every chunk

      const response = await sendFn(updatedMessages, settings, (chunk) => {
        assistantMessage.content += chunk;
        updateCounter++;

        // Only update UI every N chunks to reduce re-renders
        if (updateCounter % UPDATE_FREQUENCY === 0) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === updatedConv.id
                ? {
                    ...c,
                    messages: [...updatedMessages, assistantMessage],
                  }
                : c
            )
          );
          // Manually scroll during streaming
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      });

      // Ensure final message is saved
      assistantMessage.content = response;
      const finalConv = {
        ...updatedConv,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === finalConv.id ? finalConv : c))
      );
      storage.saveConversation(finalConv);

      // Check for artifacts in the response
      const artifacts = parseArtifacts(response, assistantMessage.id);
      if (artifacts.length > 0) {
        setCurrentArtifact(artifacts[0]); // Show the first artifact
        setShowArtifactPanel(true);
      }

      // Check for browser navigation in the response
      const browserUrlMatch = response.match(/browser_navigate[^}]*url['"]?\s*:\s*['"]([^'"]+)['"]/);
      if (browserUrlMatch && browserUrlMatch[1]) {
        setBrowserUrl(browserUrlMatch[1]);
        setShowBrowserMode(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to compress images before upload
  const compressImage = async (file: File, maxSizeMB: number = 4): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate scaling to reduce file size
          const quality = 0.9;
          let scale = 1;

          // For very large images, scale down dimensions
          const maxDimension = 2048;
          if (img.width > maxDimension || img.height > maxDimension) {
            scale = Math.min(maxDimension / img.width, maxDimension / img.height);
          }

          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Try to compress to target size
          const tryCompress = (q: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }

                const compressedSizeMB = blob.size / 1024 / 1024;
                console.log(`🗜️ Compressed to ${compressedSizeMB.toFixed(2)}MB at quality ${q}`);

                // If still too large and quality can be reduced, try again
                if (compressedSizeMB > maxSizeMB && q > 0.3) {
                  tryCompress(q - 0.1);
                } else {
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              },
              file.type,
              q
            );
          };

          tryCompress(quality);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📎 Files selected:', files.length, files.map(f => f.name));

    if (files.length === 0) return;

    // File size limit: 10MB for documents, 4MB for images (compressed)
    const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_IMG_SIZE = 4 * 1024 * 1024;  // 4MB (target after compression)

    setIsProcessingFile(true);

    try {
      for (const file of files) {
        try {
          console.log('🔄 Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

          // For documents (PDF, DOCX, TXT, MD), extract text content
          const isDocument = file.type === 'application/pdf' ||
                            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                            file.type === 'text/plain' ||
                            file.type === 'text/markdown' ||
                            file.name.endsWith('.pdf') ||
                            file.name.endsWith('.docx') ||
                            file.name.endsWith('.txt') ||
                            file.name.endsWith('.md');

          console.log('📄 Is document?', isDocument);

          let processedFile = file;

          // For images, compress if needed
          if (!isDocument && file.size > MAX_IMG_SIZE) {
            const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
            console.log(`🗜️ Compressing image from ${originalSizeMB}MB...`);
            processedFile = await compressImage(file, MAX_IMG_SIZE / 1024 / 1024);
            const newSizeMB = (processedFile.size / 1024 / 1024).toFixed(2);
            console.log(`✅ Compressed from ${originalSizeMB}MB to ${newSizeMB}MB`);
          }

          // Check file size after compression
          const maxSize = isDocument ? MAX_DOC_SIZE : MAX_IMG_SIZE * 1.2; // Allow 20% buffer for base64
          const maxSizeMB = Math.round(maxSize / 1024 / 1024);

          if (processedFile.size > maxSize) {
            const fileSizeMB = (processedFile.size / 1024 / 1024).toFixed(2);
            throw new Error(`File too large: ${fileSizeMB}MB (max ${maxSizeMB}MB for ${isDocument ? 'documents' : 'images'})`);
          }

          let content: string;
          if (isDocument) {
            // Extract text from document
            console.log('📖 Extracting text from document...');
            content = await processDocument(processedFile);
            console.log('✅ Extracted', content.length, 'characters');
          } else {
            // For images, use base64
            console.log('🖼️ Converting image to base64...');
            content = await fileToBase64(processedFile);
            console.log('✅ Converted to base64');
          }

          const attachedFile = createAttachedFile(processedFile, content);
          console.log('📌 Created attached file:', attachedFile);

          setAttachedFiles((prev) => {
            const updated = [...prev, attachedFile];
            console.log('📋 Updated attachedFiles:', updated);
            return updated;
          });

          console.log('✅ File attached successfully:', file.name);
        } catch (error) {
          console.error('❌ Failed to process file:', file.name, error);
          alert(`Failed to process file: ${file.name}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const supportedFiles = files.filter(file =>
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'text/plain' ||
      file.type === 'text/markdown' ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md')
    );

    console.log('📎 Files dropped:', supportedFiles.length, supportedFiles.map(f => f.name));

    if (supportedFiles.length === 0) return;

    // File size limit: 10MB for documents, 4MB for images (compressed)
    const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_IMG_SIZE = 4 * 1024 * 1024;  // 4MB (target after compression)

    setIsProcessingFile(true);

    try {
      for (const file of supportedFiles) {
        try {
          console.log('🔄 Processing dropped file:', file.name, 'Type:', file.type, 'Size:', file.size);

          // For documents (PDF, DOCX, TXT, MD), extract text content
          const isDocument = file.type === 'application/pdf' ||
                            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                            file.type === 'text/plain' ||
                            file.type === 'text/markdown' ||
                            file.name.endsWith('.pdf') ||
                            file.name.endsWith('.docx') ||
                            file.name.endsWith('.txt') ||
                            file.name.endsWith('.md');

          let processedFile = file;

          // For images, compress if needed
          if (!isDocument && file.size > MAX_IMG_SIZE) {
            const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
            console.log(`🗜️ Compressing dropped image from ${originalSizeMB}MB...`);
            processedFile = await compressImage(file, MAX_IMG_SIZE / 1024 / 1024);
            const newSizeMB = (processedFile.size / 1024 / 1024).toFixed(2);
            console.log(`✅ Compressed from ${originalSizeMB}MB to ${newSizeMB}MB`);
          }

          // Check file size after compression
          const maxSize = isDocument ? MAX_DOC_SIZE : MAX_IMG_SIZE * 1.2; // Allow 20% buffer for base64
          const maxSizeMB = Math.round(maxSize / 1024 / 1024);

          if (processedFile.size > maxSize) {
            const fileSizeMB = (processedFile.size / 1024 / 1024).toFixed(2);
            throw new Error(`File too large: ${fileSizeMB}MB (max ${maxSizeMB}MB for ${isDocument ? 'documents' : 'images'})`);
          }

          let content: string;
          if (isDocument) {
            // Extract text from document
            console.log('📖 Extracting text from dropped document...');
            content = await processDocument(processedFile);
            console.log('✅ Extracted', content.length, 'characters from drop');
          } else {
            // For images, use base64
            console.log('🖼️ Converting dropped image to base64...');
            content = await fileToBase64(processedFile);
            console.log('✅ Converted dropped image to base64');
          }

          const attachedFile = createAttachedFile(processedFile, content);
          console.log('📌 Created attached file from drop:', attachedFile);

          setAttachedFiles((prev) => {
            const updated = [...prev, attachedFile];
            console.log('📋 Updated attachedFiles from drop:', updated);
            return updated;
          });

          console.log('✅ Dropped file attached successfully:', file.name);
        } catch (error) {
          console.error('❌ Failed to process dropped file:', file.name, error);
          alert(`Failed to process dropped file: ${file.name}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSettingsChange = (newSettings: ModelSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const deleteConversation = (id: string) => {
    storage.deleteConversation(id);
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (currentConversationId === id) {
      setCurrentConversationId(filtered[0]?.id || null);
      if (filtered[0]) {
        storage.setCurrentConversationId(filtered[0].id);
      }
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    storage.saveProject(updatedProject);
  };

  const handleMCPServersChange = (servers: MCPServer[]) => {
    setMcpServers(servers);
    storage.saveMCPServers(servers);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Get conversations without projects (orphaned)
  const orphanedConversations = conversations.filter((c) => !c.projectId);

  // Prevent hydration mismatch by not rendering until mounted on client
  if (!mounted) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Browser Mode Layout */}
      {showBrowserMode ? (
        <>
          {/* Browser iframe on the left (70%) */}
          <div className="flex-1 border-r border-border bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium text-foreground">Browser</span>
                <span className="text-xs text-muted-foreground truncate">{browserUrl}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBrowserMode(false)}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <iframe
                src={browserUrl}
                className="w-full h-full border-0"
                title="Browser Preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>

          {/* Chat sidebar on the right (30%) */}
          <div className="w-[30%] min-w-[400px] flex flex-col border-l border-border bg-background">
            <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Chat</span>
              <div className="flex items-center gap-2">
                <ServerStatus />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-auto" ref={scrollRef} style={{ scrollbarWidth: 'thin' }}>
              <div className="p-4 space-y-4">
                {currentConversation?.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} rounded-lg px-4 py-2`}>
                      <MarkdownMessage content={message.content} />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 border-t border-border p-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Message Qwen2.5..."
                  className="min-h-[60px] max-h-[150px] resize-none pr-12"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8"
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Mobile sidebar overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Qwen2.5-style Compact Sidebar */}
          <div className={`
            w-64 border-r border-border bg-secondary flex flex-col h-screen
            fixed lg:static inset-y-0 left-0 z-50
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
        {/* Top: New Conversation Button */}
        <div className="shrink-0 p-4 border-b border-border">
          <Button 
            onClick={() => createNewConversation()} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New conversation
          </Button>
        </div>

        {/* Middle: Scrollable Conversations List */}
        <div className="flex-1 min-h-0">
          <div className="h-full p-3 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                  conv.id === currentConversationId
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setCurrentConversationId(conv.id);
                  storage.setCurrentConversationId(conv.id);
                  setIsSidebarOpen(false); // Close sidebar on mobile after selection
                }}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-sm text-foreground">
                  {conv.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Compact Menu */}
        <div className="shrink-0 relative">
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setShowBottomMenu(!showBottomMenu)}
            >
              <MoreHorizontal className="h-4 w-4 mr-2" />
              <span className="text-sm">Menu</span>
            </Button>
          </div>

          {/* Popup Menu */}
          {showBottomMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-popover border border-border rounded-lg shadow-lg py-2 z-50">
              {/* Settings */}
              <SettingsDialog 
                settings={settings} 
                onSettingsChange={handleSettingsChange}
                trigger={
                  <Button variant="ghost" className="w-full justify-start px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Button>
                }
              />
              
              {/* MCP Servers */}
              <MCPServersDialog 
                servers={mcpServers} 
                onServersChange={handleMCPServersChange}
                trigger={
                  <Button variant="ghost" className="w-full justify-start px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                    <Server className="h-4 w-4 mr-3" />
                    MCP Servers
                  </Button>
                }
              />
              
              {/* Create Project */}
              <CreateProjectDialog 
                onCreateProject={handleCreateProject}
                trigger={
                  <Button variant="ghost" className="w-full justify-start px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                    <FolderPlus className="h-4 w-4 mr-3" />
                    New Project
                  </Button>
                }
              />

              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  toggleDarkMode();
                  setShowBottomMenu(false);
                }}
              >
                {isDarkMode ? <Sun className="h-4 w-4 mr-3" /> : <Moon className="h-4 w-4 mr-3" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>

              {/* TinyLlama Backend Toggle */}
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setUseTinyLlama(!useTinyLlama);
                  setShowBottomMenu(false);
                }}
              >
                <Server className="h-4 w-4 mr-3" />
                {useTinyLlama ? 'Using TinyLlama' : 'Using Ollama'}
              </Button>

              {/* Projects List (if any exist) */}
              {projects.length > 0 && (
                <>
                  <div className="border-t border-border mt-2 pt-2">
                    <div className="px-4 py-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Projects
                      </span>
                    </div>
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="group flex items-center gap-3 px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        onClick={() => {
                          router.push(`/project/${project.id}`);
                          setShowBottomMenu(false);
                        }}
                      >
                        <div className="h-3 w-3 bg-muted-foreground rounded shrink-0"></div>
                        <span className="flex-1 truncate text-sm text-popover-foreground">
                          {project.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete project "${project.name}" and all its conversations?`)) {
                              deleteProject(project.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Click outside to close menu */}
          {showBottomMenu && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowBottomMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Qwen2.5-style Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Minimal Header */}
        <div className="flex-shrink-0 border-b border-border bg-background px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger menu */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="h-9 w-9 lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <button
                onClick={() => {
                  // Scroll to top when title is clicked
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = 0;
                  }
                }}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Qwen2.5
              </button>
            </div>
            <div className="flex items-center gap-3">
              <ServerStatus />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Qwen2.5-style Messages */}
        <div
          className="flex-1 w-full bg-background overflow-auto"
          ref={scrollRef}
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="max-w-none w-full pb-4">
            {!currentConversation?.messages.length && (
              <div className="flex items-center justify-center pt-12 sm:pt-20 pb-4 px-4">
                <div className="text-center max-w-2xl">
                  <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-2 sm:mb-4">
                    How can I help you today?
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    I&apos;m Qwen2.5, an advanced AI assistant. I can help with coding, analysis, creative tasks, and much more.
                  </p>
                </div>
              </div>
            )}
            
            {currentConversation?.messages.map((message) => (
              <div
                key={message.id}
                className="py-3 px-3 sm:px-4"
              >
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] md:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 flex items-center justify-center text-xs sm:text-sm font-medium ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}>
                      {message.role === 'user' ? 'You' : 'Q'}
                    </div>

                    {/* Message bubble */}
                    <div className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-md'
                    }`}>
                      {/* File attachments */}
                      {message.files && message.files.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {message.files.map((file) => (
                            <div key={file.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                              message.role === 'user' 
                                ? 'bg-blue-400 text-blue-50' 
                                : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                            }`}>
                              <Paperclip className="h-4 w-4" />
                              <span>{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Message content with markdown support */}
                      <div className="text-sm leading-relaxed">
                        <MarkdownMessage content={stripArtifactTags(message.content)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="py-3 px-3 sm:px-4">
                <div className="flex justify-start mb-1">
                  <div className="flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] md:max-w-[80%]">
                    {/* Avatar */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white shrink-0 flex items-center justify-center text-xs sm:text-sm font-medium">
                      Q
                    </div>

                    {/* Loading bubble */}
                    <div className="bg-gray-100 dark:bg-gray-800 text-foreground rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Qwen2.5-style Input Area */}
        <div className="flex-shrink-0 border-t border-border bg-background">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
            {/* Show loading indicator while processing files */}
            {isProcessingFile && (
              <div className="mb-2 sm:mb-3">
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">Processing file...</span>
                </div>
              </div>
            )}

            {/* Show attached files */}
            {attachedFiles.length > 0 && (
              <div className="mb-2 sm:mb-3 space-y-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 bg-muted px-4 py-3 rounded-lg"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              className="relative"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload files"
              />

              {/* Drag and drop overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-10 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium text-primary">Drop images here</p>
                  </div>
                </div>
              )}

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message Qwen2.5..."
                className="min-h-[48px] sm:min-h-[60px] max-h-[150px] sm:max-h-[200px] resize-none border-input focus:border-ring focus:ring-ring rounded-xl pr-16 text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isProcessingFile}
                  title={isProcessingFile ? "Processing file..." : "Attach file"}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSendMessage}
                  disabled={isLoading || isProcessingFile || (!input.trim() && attachedFiles.length === 0)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Artifact Preview Panel */}
      {showArtifactPanel && currentArtifact && (
        <ArtifactPreview
          artifact={currentArtifact}
          onClose={() => setShowArtifactPanel(false)}
          width={artifactPanelWidth}
          onResize={setArtifactPanelWidth}
        />
      )}

      {/* Floating New Chat Button (Mobile) */}
      <Button
        onClick={() => {
          createNewConversation();
          // Scroll to top on mobile
          if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
          }
        }}
        className="fixed bottom-20 right-4 lg:hidden h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground z-50"
        size="icon"
        aria-label="New conversation"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
