import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  PlusCircle,
  Paperclip,
  Send,
  Users,
  Shield,
  Briefcase,
  Phone,
  FileText,
  Image,
  Download,
  Lock,
  Unlock,
  CheckCheck,
  AlertCircle,
  X,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Conversation, Message, User } from '../../types';
import { BalcadLogo } from '../BalcadLogo';

export const InternalMessagingView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [convFilterQuery, setConvFilterQuery] = useState('');

  // New Chat Modal & Staff Search
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffSearchResults, setStaffSearchResults] = useState<User[]>([]);
  const [isSearchingStaff, setIsSearchingStaff] = useState(false);

  // Create Group Modal (Super Admin)
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  useEffect(() => {
    loadConversations();
    loadAllStaff();

    // Live background polling so messages update automatically in real-time
    const interval = setInterval(() => {
      api.getConversations().then((data) => {
        setConversations(data);
      }).catch(() => {});

      if (activeConvRef.current) {
        api.getMessages(activeConvRef.current.id).then((msgs) => {
          setMessages((prev) => {
            if (prev.length !== msgs.length || (msgs.length > 0 && prev[prev.length - 1]?.id !== msgs[msgs.length - 1]?.id)) {
              return msgs;
            }
            return prev;
          });
        }).catch(() => {});
      }
    }, 2000);

    try {
      const ch = new BroadcastChannel('balcad_messaging');
      ch.onmessage = (ev) => {
        api.getConversations().then(setConversations).catch(() => {});
        if (activeConvRef.current && ev.data?.convId === activeConvRef.current.id) {
          api.getMessages(activeConvRef.current.id).then(setMessages).catch(() => {});
        }
      };
      return () => {
        clearInterval(interval);
        ch.close();
      };
    } catch {
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoadingConv(true);
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConv) {
        setActiveConv(data[0]);
      }
    } catch (err) {
      console.warn('Messaging notice:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const loadAllStaff = async () => {
    try {
      const data = await api.searchStaff('');
      const others = data.filter(
        (u) =>
          u.id !== user?.id &&
          u.username.toLowerCase() !== (user?.username || '').toLowerCase() &&
          u.status !== 'disabled'
      );
      setAllStaff(others);
      setStaffSearchResults(others);
    } catch (e) {
      console.warn('Staff search notice:', e);
    }
  };

  const loadMessages = async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.warn('Messages load notice:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleStaffSearch = (q: string) => {
    setStaffSearchQuery(q);
    if (!q.trim()) {
      setStaffSearchResults(allStaff);
      return;
    }
    const clean = q.toLowerCase().trim();
    const filtered = allStaff.filter(
      (s) =>
        s.username.toLowerCase().includes(clean) ||
        (s.profile?.full_name && s.profile.full_name.toLowerCase().includes(clean)) ||
        (s.profile?.phone && s.profile.phone.includes(clean)) ||
        (s.profile?.department && s.profile.department.toLowerCase().includes(clean))
    );
    setStaffSearchResults(filtered);
  };

  const handleStartDirectChat = async (targetUser: User) => {
    try {
      const conv = await api.startDirectConversation(targetUser.id);
      setShowNewChatModal(false);
      setStaffSearchQuery('');
      setStaffSearchResults(allStaff);
      await loadConversations();
      setActiveConv(conv);
      showToast(`Conversation started with @${targetUser.username}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to start conversation', 'error');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    try {
      const grp = await api.createGroupConversation(groupTitle, selectedStaffIds);
      showToast(`Group "${groupTitle}" created successfully!`, 'success');
      setShowGroupModal(false);
      setGroupTitle('');
      setSelectedStaffIds([]);
      await loadConversations();
      setActiveConv(grp);
    } catch (err: any) {
      showToast(err.message || 'Failed to create group', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!inputText.trim() && attachments.length === 0) return;

    try {
      const newMsg = await api.sendMessage(activeConv.id, inputText, attachments);
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
      setAttachments([]);
      await loadConversations();
      try {
        const ch = new BroadcastChannel('balcad_messaging');
        ch.postMessage({ type: 'NEW_MESSAGE', convId: activeConv.id });
        ch.close();
      } catch {}
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file size (max 15MB)
      if (file.size > 15 * 1024 * 1024) {
        showToast(`File ${file.name} exceeds 15MB size limit.`, 'warning');
        return;
      }
      // Block executable / dangerous extensions
      if (/\.(exe|bat|cmd|sh|vbs|msi)$/i.test(file.name)) {
        showToast('Executable files are not permitted for security.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          {
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            file_url: event.target?.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleToggleClose = async () => {
    if (!activeConv) return;
    const nextStatus = activeConv.status === 'open' ? 'closed' : 'open';
    try {
      const updated = await api.toggleConversationStatus(activeConv.id, nextStatus);
      setActiveConv(updated);
      showToast(nextStatus === 'closed' ? 'Conversation closed' : 'Conversation reopened', 'info');
      await loadConversations();
    } catch (err: any) {
      showToast(err.message || 'Failed to update conversation status', 'error');
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-amber-400" />
              <span>{t('internal_messaging')}</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase">
              Staff Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Private internal communication for Balcad Travel Agency team. Customer chat is strictly separated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setShowGroupModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>{t('create_group')}</span>
            </button>
          )}

          <button
            onClick={() => setShowNewChatModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('new_chat')}</span>
          </button>
        </div>
      </div>

      {/* Main Messaging Container */}
      <div className="bg-[#111726] border border-slate-800 rounded-3xl shadow-2xl h-[700px] flex overflow-hidden">
        {/* Left: Conversations Sidebar */}
        <div className="w-72 sm:w-80 border-r border-slate-800 flex flex-col bg-[#0C101B]">
          <div className="p-3.5 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Conversations ({conversations.length})
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={convFilterQuery}
                onChange={(e) => setConvFilterQuery(e.target.value)}
                placeholder="Filter chats & staff..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {/* Conversations List */}
            {(() => {
              const q = convFilterQuery.toLowerCase().trim();
              const filtered = conversations.filter((c) => {
                if (!q) return true;
                const matchTitle = (c.title || '').toLowerCase().includes(q);
                const matchParticipant = c.participants.some(
                  (p) =>
                    p.username.toLowerCase().includes(q) ||
                    (p.full_name && p.full_name.toLowerCase().includes(q))
                );
                return matchTitle || matchParticipant;
              });

              if (filtered.length === 0 && conversations.length > 0) {
                return (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Wax chat ah oo ku habboon lama helin.
                  </div>
                );
              }

              if (conversations.length === 0) {
                return (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <p className="font-semibold text-slate-300">Weli wax sheeko ah ma furid.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Dooro shaqaalaha hoose si aad ula shekeysato.</p>
                  </div>
                );
              }

              return filtered.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                const isGroup = conv.type === 'group';
                const otherParticipant =
                  conv.participants.find(
                    (p) =>
                      p.user_id !== user?.id &&
                      p.username.toLowerCase() !== (user?.username || '').toLowerCase()
                  ) || conv.participants[0];
                const title = (isGroup ? conv.title : (otherParticipant?.full_name || `@${otherParticipant?.username}`)) || 'Staff Member';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full p-3.5 text-left transition flex items-start gap-3 cursor-pointer ${
                      isActive ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs shrink-0 text-amber-300">
                      {isGroup ? <Users className="w-5 h-5 text-amber-400" /> : title[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{title}</span>
                        {conv.status === 'closed' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            Closed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {conv.last_message ? conv.last_message.message_text : 'Sheekadu waa furan tahay'}
                      </p>
                    </div>
                  </button>
                );
              });
            })()}

            {/* Quick Staff Directory in Sidebar */}
            {allStaff.length > 0 && (
              <div className="pt-2 pb-1 bg-slate-950/30">
                <span className="px-3.5 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-mono">
                  Shaqaalaha Shirkadda ({allStaff.length})
                </span>
                <div className="divide-y divide-slate-800/30">
                  {allStaff.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleStartDirectChat(st)}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-800/40 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-xs text-slate-300 font-medium group-hover:text-amber-300 block truncate">
                            {st.profile?.full_name || st.username}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            @{st.username} • {st.profile?.department || 'Staff'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition font-mono shrink-0">
                        Chat
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Chat Window */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-[#111726]">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0E1322]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                  {activeConv.type === 'group' ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    (activeConv.participants.find((p) => p.user_id !== user?.id && p.username.toLowerCase() !== (user?.username || '').toLowerCase())?.full_name?.[0] || 'S')
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">
                    {activeConv.type === 'group'
                      ? activeConv.title
                      : activeConv.participants.find((p) => p.user_id !== user?.id && p.username.toLowerCase() !== (user?.username || '').toLowerCase())?.full_name || `@${activeConv.participants.find((p) => p.user_id !== user?.id && p.username.toLowerCase() !== (user?.username || '').toLowerCase())?.username || 'Staff'}`}
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    {activeConv.type === 'group' ? (
                      <span>{activeConv.participants.length} team members</span>
                    ) : (
                      <span>
                        Phone: {activeConv.participants.find((p) => p.user_id !== user?.id && p.username.toLowerCase() !== (user?.username || '').toLowerCase())?.phone || 'N/A'} • @
                        {activeConv.participants.find((p) => p.user_id !== user?.id && p.username.toLowerCase() !== (user?.username || '').toLowerCase())?.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Close/Reopen Button */}
              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                    Super Admin View
                  </span>
                )}

                <button
                  onClick={handleToggleClose}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeConv.status === 'open'
                      ? 'bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {activeConv.status === 'open' ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>{t('close_chat')}</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>{t('reopen_chat')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Closed Banner */}
            {activeConv.status === 'closed' && (
              <div className="p-2.5 bg-amber-500/10 border-b border-amber-500/20 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{t('chat_closed_banner')}</span>
              </div>
            )}

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {loadingMsgs ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No messages yet. Send a note or attach documents to collaborate.
                </div>
              ) : (
                messages.map((m) => {
                  const isMine =
                    m.sender_id === user?.id ||
                    (!!m.sender_username &&
                      m.sender_username.toLowerCase() === (user?.username || '').toLowerCase());

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 font-mono">
                        <span className="font-semibold text-slate-300">{m.sender_name}</span>
                        <span>(@{m.sender_username})</span>
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                          isMine
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                            : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                        }`}
                      >
                        {m.message_text && <p className="whitespace-pre-wrap">{m.message_text}</p>}

                        {/* Attachments preview */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5 pt-1 border-t border-black/10">
                            {m.attachments.map((att) => (
                              <div
                                key={att.id}
                                className={`flex items-center justify-between p-2 rounded-xl text-[11px] ${
                                  isMine ? 'bg-amber-600/30 text-slate-950' : 'bg-slate-900 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{att.file_name}</span>
                                </div>
                                <a
                                  href={att.file_url}
                                  download={att.file_name}
                                  className="p-1 hover:opacity-80 transition shrink-0 ml-2"
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachments Preview Queue */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30"
                  >
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{att.file_name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-amber-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            {activeConv.status === 'open' && (
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-[#0C101B] flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={t('attach_file')}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('type_message')}
                  className="flex-1 py-2 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() && attachments.length === 0}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#111726]">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center mb-4 shadow-xl">
              <MessageSquare className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Sheekooyinka Gudaha ee Shaqaalaha (Internal Staff Chat)
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
              Kala xiriir dhammaan shaqaalaha iyo maamulka shirkadda halkan si toos ah. Dooro koox ama shaqaale dhinaca bidix kaga yaal, ama hoos ka bilow sheeko cusub.
            </p>

            {allStaff.length > 0 && (
              <div className="mt-6 max-w-xl w-full">
                <span className="text-[11px] font-mono uppercase font-bold text-amber-400 block mb-2.5">
                  Dooro Shaqaale Aad La Hadasho (Click to Chat):
                </span>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {allStaff.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleStartDirectChat(st)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/80 transition flex items-center gap-2 cursor-pointer active:scale-95 group shadow"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 block">
                          {st.profile?.full_name || st.username}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          @{st.username} • {st.profile?.department || 'Staff'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  loadAllStaff();
                  setStaffSearchResults(allStaff);
                  setStaffSearchQuery('');
                  setShowNewChatModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Bilow Sheeko Cusub (New Chat)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: New Chat with Staff Search */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Start Internal Staff Chat
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Dooro ama raadi shaqaale u diiwaangashan shirkadda si aad fariin toos ah ugu dirto.
            </p>

            <div className="mt-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={staffSearchQuery}
                onChange={(e) => handleStaffSearch(e.target.value)}
                placeholder="Search by username, full name, or phone number..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="mt-4 max-h-64 overflow-y-auto divide-y divide-slate-800/80">
              {isSearchingStaff ? (
                <div className="p-4 text-center text-xs text-slate-500">Searching staff...</div>
              ) : (staffSearchResults.length === 0 && allStaff.length === 0) ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Shaqaale kale ma diiwaangashana xilligan.
                </div>
              ) : (staffSearchResults.length === 0 && staffSearchQuery) ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Wax shaqaale ah oo ku habboon lama helin "{staffSearchQuery}".
                </div>
              ) : (
                (staffSearchResults.length > 0 ? staffSearchResults : allStaff).map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleStartDirectChat(st)}
                    className="p-3 hover:bg-slate-800/60 rounded-xl cursor-pointer flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-xs">
                        {st.profile?.full_name ? st.profile.full_name[0] : st.username[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition">
                          {st.profile?.full_name || st.username}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          @{st.username} • {st.profile?.phone || 'No phone'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {st.profile?.department || 'Staff'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold opacity-0 group-hover:opacity-100 transition">
                        Chat
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Group (Super Admin) */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Create Internal Staff Group
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Group Title *</label>
                <input
                  type="text"
                  required
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="e.g. VIP Bookings & Visa Team"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Participants</label>
                <div className="max-h-48 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  {allStaff.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStaffIds.includes(st.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaffIds((prev) => [...prev, st.id]);
                          } else {
                            setSelectedStaffIds((prev) => prev.filter((id) => id !== st.id));
                          }
                        }}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="font-medium text-white">{st.profile?.full_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">(@{st.username})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
