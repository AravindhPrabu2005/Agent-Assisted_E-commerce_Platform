import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const ChatBot = () => {
  const currentUserId =
    localStorage.getItem("userId") ||
    localStorage.getItem("customerId") ||
    localStorage.getItem("id") ||
    "";

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  const messages = useMemo(() => {
    return Array.isArray(activeConversation?.messages)
      ? activeConversation.messages
      : [];
  }, [activeConversation]);

  const isValidMongoId = (id) => {
    return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id.trim());
  };

  const getUserRequestConfig = () => ({
    headers: {
      "x-user-id": currentUserId,
    },
  });

  const scrollToBottom = (behavior = "smooth") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  };

  const loadConversationById = async (conversationId) => {
    if (!isValidMongoId(conversationId)) return;
    if (!isValidMongoId(currentUserId)) return;

    try {
      setConversationLoading(true);
      const res = await axiosInstance.get(
        `/conversations/${conversationId.trim()}`,
        getUserRequestConfig()
      );
      setActiveConversation(res.data);
      setActiveConversationId(res.data._id);
      setMobileSidebarOpen(false);
      scrollToBottom("auto");
    } catch (error) {
      console.error(
        "Failed to load conversation:",
        error.response?.data || error.message
      );
    } finally {
      setConversationLoading(false);
    }
  };

  const loadConversations = async (preferredId = null) => {
    if (!isValidMongoId(currentUserId)) {
      setSidebarLoading(false);
      setConversations([]);
      setActiveConversation(null);
      setActiveConversationId(null);
      return;
    }

    try {
      setSidebarLoading(true);
      const res = await axiosInstance.get("/conversations", getUserRequestConfig());
      const list = Array.isArray(res.data) ? res.data : [];
      setConversations(list);

      if (list.length === 0) {
        const created = await axiosInstance.post(
          "/conversations",
          { userId: currentUserId },
          getUserRequestConfig()
        );

        const newConversation = created.data;

        setConversations([
          {
            _id: newConversation._id,
            title: newConversation.title,
            createdAt: newConversation.createdAt,
            updatedAt: newConversation.updatedAt,
          },
        ]);

        setActiveConversationId(newConversation._id);
        setActiveConversation(newConversation);
        setMobileSidebarOpen(false);
        return;
      }

      const nextId =
        preferredId && list.some((item) => item._id === preferredId)
          ? preferredId
          : list[0]?._id;

      if (isValidMongoId(nextId)) {
        await loadConversationById(nextId);
      }
    } catch (error) {
      console.error(
        "Failed to load conversations:",
        error.response?.data || error.message
      );
    } finally {
      setSidebarLoading(false);
    }
  };

  useEffect(() => {
    if (!isValidMongoId(currentUserId)) {
      setSidebarLoading(false);
      return;
    }
    loadConversations();
  }, [currentUserId]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      160
    )}px`;
  }, [input]);

  const handleNewChat = async () => {
    if (!isValidMongoId(currentUserId)) return;

    try {
      const res = await axiosInstance.post(
        "/conversations",
        { userId: currentUserId },
        getUserRequestConfig()
      );
      const newConversation = res.data;

      setConversations((prev) => [
        {
          _id: newConversation._id,
          title: newConversation.title,
          createdAt: newConversation.createdAt,
          updatedAt: newConversation.updatedAt,
        },
        ...prev,
      ]);

      setActiveConversation(newConversation);
      setActiveConversationId(newConversation._id);
      setInput("");
      setMobileSidebarOpen(false);
      scrollToBottom("auto");
    } catch (error) {
      console.error(
        "Failed to create conversation:",
        error.response?.data || error.message
      );
    }
  };

  const handleRenameConversation = async (conversationId, currentTitle) => {
    if (!isValidMongoId(conversationId) || !isValidMongoId(currentUserId)) return;

    const nextTitle = window.prompt(
      "Rename conversation",
      currentTitle || "New chat"
    );
    if (!nextTitle || !nextTitle.trim()) return;

    try {
      const res = await axiosInstance.patch(
        `/conversations/${conversationId.trim()}/title`,
        {
          title: nextTitle.trim(),
          userId: currentUserId,
        },
        getUserRequestConfig()
      );

      setConversations((prev) =>
        prev.map((item) =>
          item._id === conversationId
            ? {
                ...item,
                title: res.data.title,
                updatedAt: res.data.updatedAt,
              }
            : item
        )
      );

      if (activeConversationId === conversationId) {
        setActiveConversation((prev) =>
          prev
            ? {
                ...prev,
                title: res.data.title,
                updatedAt: res.data.updatedAt,
              }
            : prev
        );
      }
    } catch (error) {
      console.error(
        "Failed to rename conversation:",
        error.response?.data || error.message
      );
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!isValidMongoId(conversationId) || !isValidMongoId(currentUserId)) return;

    try {
      await axiosInstance.delete(
        `/conversations/${conversationId.trim()}`,
        getUserRequestConfig()
      );

      const remaining = conversations.filter((item) => item._id !== conversationId);
      setConversations(remaining);

      if (remaining.length === 0) {
        const created = await axiosInstance.post(
          "/conversations",
          { userId: currentUserId },
          getUserRequestConfig()
        );
        const newConversation = created.data;

        setConversations([
          {
            _id: newConversation._id,
            title: newConversation.title,
            createdAt: newConversation.createdAt,
            updatedAt: newConversation.updatedAt,
          },
        ]);
        setActiveConversation(newConversation);
        setActiveConversationId(newConversation._id);
        return;
      }

      if (
        activeConversationId === conversationId &&
        isValidMongoId(remaining[0]?._id)
      ) {
        await loadConversationById(remaining[0]._id);
      }
    } catch (error) {
      console.error(
        "Failed to delete conversation:",
        error.response?.data || error.message
      );
    }
  };

  const sendMessage = async (text = input) => {
    const finalText = text.trim();

    if (!isValidMongoId(currentUserId)) return;
    if (
      !finalText ||
      loading ||
      !activeConversation ||
      !isValidMongoId(activeConversationId)
    ) {
      return;
    }

    const conversationIdAtSend = activeConversationId;
    const requestId = Date.now();
    latestRequestIdRef.current = requestId;

    const optimisticUserMessage = {
      _id: `temp-user-${requestId}`,
      role: "user",
      content: finalText,
      recommendations: [],
    };

    const nextMessages = [...messages, optimisticUserMessage];

    setActiveConversation((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), optimisticUserMessage],
    }));

    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const historyForAI = nextMessages.map((message) => ({
        role: message.role,
        content: message.content,
        recommendations: Array.isArray(message.recommendations)
          ? message.recommendations
          : [],
      }));

      const aiRes = await axiosInstance.post("/product-finder", {
        message: finalText,
        history: historyForAI,
      });

      if (latestRequestIdRef.current !== requestId) return;

      const assistantMessage = {
        role: "assistant",
        content:
          aiRes.data?.answer || "I could not find an answer for that query.",
        recommendations: Array.isArray(aiRes.data?.sources)
          ? aiRes.data.sources
          : [],
      };

      const saveRes = await axiosInstance.post(
        `/conversations/${conversationIdAtSend.trim()}/messages`,
        {
          userId: currentUserId,
          userMessage: {
            content: finalText,
          },
          assistantMessage,
        },
        getUserRequestConfig()
      );

      if (latestRequestIdRef.current !== requestId) return;

      const savedConversation = saveRes.data;

      if (savedConversation._id === conversationIdAtSend) {
        setActiveConversation(savedConversation);
        setActiveConversationId(savedConversation._id);
      }

      setConversations((prev) =>
        [
          {
            _id: savedConversation._id,
            title: savedConversation.title,
            createdAt: savedConversation.createdAt,
            updatedAt: savedConversation.updatedAt,
          },
          ...prev.filter((item) => item._id !== savedConversation._id),
        ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    } catch (err) {
      console.error("Send message error:", err.response?.data || err.message);

      if (latestRequestIdRef.current !== requestId) return;

      setActiveConversation((prev) => ({
        ...prev,
        messages: [
          ...(prev?.messages || []).filter(
            (message) => message._id !== optimisticUserMessage._id
          ),
          {
            _id: `temp-assistant-${Date.now()}`,
            role: "assistant",
            content:
              err.response?.data?.message ||
              "Something went wrong while contacting the product finder.",
            recommendations: [],
          },
        ],
      }));
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setLoading(false);
      }
      scrollToBottom();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") return null;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const shouldShowRecommendations = (items) => {
    return Array.isArray(items) && items.length > 0;
  };

  const openProduct = (id) => {
    if (!id || !isValidMongoId(id)) return;
    window.open(`/user/product/${id}`, "_blank", "noopener,noreferrer");
  };

  const formatConversationTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const IconPencil = () => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M13 7l4 4" />
    </svg>
  );

  const IconTrash = () => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );

  const IconSparkles = () => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
    </svg>
  );

  const MarkdownMessage = ({ content }) => {
    return (
      <div className="max-w-none text-slate-700">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <p
                className="my-2 whitespace-pre-wrap text-sm leading-7 sm:text-[15px]"
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul
                className="my-2 list-disc pl-5 text-sm leading-7 sm:text-[15px]"
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="my-2 list-decimal pl-5 text-sm leading-7 sm:text-[15px]"
                {...props}
              />
            ),
            li: ({ node, ...props }) => <li className="my-1 pl-1" {...props} />,
            strong: ({ node, ...props }) => (
              <strong className="font-bold text-slate-900" {...props} />
            ),
            a: ({ node, ...props }) => (
              <a
                className="font-medium text-[#0e3558] underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
          }}
        >
          {content || ""}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <>
      <UserNavbar />

      <main className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f7f7f8]">
        <div className="flex h-full w-full overflow-hidden">
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed left-0 top-[72px] z-40 flex h-[calc(100dvh-72px)] w-[258px] flex-col overflow-hidden border-r border-slate-200 bg-[#f9f9fb] transition-transform duration-300 lg:static lg:top-0 lg:h-full lg:translate-x-0 ${
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="border-b border-slate-200 p-3">
              <button
                onClick={handleNewChat}
                className="flex w-full items-center justify-center rounded-2xl bg-[#0e3558] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15466f]"
              >
                + New chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {sidebarLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-xl bg-white p-2.5 shadow-sm">
                      <div className="h-3.5 animate-pulse rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => {
                    const isActive = conversation._id === activeConversationId;

                    return (
                      <div
                        key={conversation._id}
                        className={`group flex items-center gap-2 rounded-xl px-2 py-1.5 transition ${
                          isActive ? "bg-white shadow-sm" : "hover:bg-white/80"
                        }`}
                      >
                        <button
                          onClick={() => loadConversationById(conversation._id)}
                          className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left"
                        >
                          <p className="truncate text-sm font-medium text-slate-700">
                            {conversation.title || "New chat"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatConversationTime(conversation.updatedAt)}
                          </p>
                        </button>

                        <div className="flex shrink-0 items-center gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                          <button
                            onClick={() =>
                              handleRenameConversation(
                                conversation._id,
                                conversation.title
                              )
                            }
                            aria-label="Rename conversation"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <IconPencil />
                          </button>

                          <button
                            onClick={() => handleDeleteConversation(conversation._id)}
                            aria-label="Delete conversation"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
                  aria-label="Open conversation sidebar"
                >
                  ☰
                </button>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-[#0e3558] sm:text-xl">
                    {activeConversation?.title || "New chat"}
                  </h1>
                  <p className="text-xs text-slate-400 sm:text-sm">
                    Product Finder Assistant
                  </p>
                </div>
              </div>

              <button
                onClick={handleNewChat}
                className="hidden shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
              >
                New chat
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
                  {conversationLoading ? (
                    <div className="space-y-5">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex justify-start">
                          <div className="w-full max-w-3xl">
                            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                            <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="max-w-xl text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0e3558]/8 text-[#0e3558]">
                          <IconSparkles />
                        </div>
                        <h2 className="mt-5 text-2xl font-bold text-[#0e3558]">
                          Start your product search
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-[15px]">
                          Ask for products by budget, features, category, or use
                          case, and get clean suggestions with matching items.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={message._id || message.id || index}
                          className={`flex w-full ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`flex w-full max-w-3xl flex-col ${
                              message.role === "user"
                                ? "items-end"
                                : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-full ${
                                message.role === "user"
                                  ? "rounded-[22px] bg-[#0e3558] px-4 py-3 text-white shadow-[0_6px_18px_rgba(14,53,88,0.16)] sm:px-5 sm:py-4"
                                  : "rounded-none bg-transparent px-0 py-0 text-slate-700 shadow-none"
                              }`}
                            >
                              {message.role === "assistant" ? (
                                <MarkdownMessage content={message.content} />
                              ) : (
                                <p className="whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">
                                  {message.content}
                                </p>
                              )}
                            </div>

                            {message.role === "assistant" &&
                              shouldShowRecommendations(message.recommendations) && (
                                <div className="mt-4 flex w-full flex-col gap-3">
                                  {message.recommendations.map((item, itemIndex) => (
                                    <button
                                      key={`${item.id || item.name}-${itemIndex}`}
                                      onClick={() => openProduct(item.id)}
                                      className="group flex w-full items-stretch overflow-hidden rounded-[22px] bg-white text-left shadow-[0_4px_18px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                                    >
                                      <div className="h-[112px] w-[104px] shrink-0 overflow-hidden bg-[#f4f6f8] sm:h-[118px] sm:w-[118px]">
                                        <img
                                          src={
                                            item.imageUrl ||
                                            "https://dummyimage.com/800x600/e5e7eb/111827&text=No+Image"
                                          }
                                          alt={item.name || "Product image"}
                                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        />
                                      </div>

                                      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                                        <div>
                                          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            {item.brand || "Brand"}
                                            {item.category ? ` • ${item.category}` : ""}
                                          </p>

                                          <h3 className="mt-1 line-clamp-1 text-sm font-bold text-[#0e3558] sm:text-[15px]">
                                            {item.name || "Unnamed Product"}
                                          </h3>

                                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm">
                                            {item.shortDescription ||
                                              "No short description available."}
                                          </p>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                          {formatPrice(item.discountPrice) ? (
                                            <>
                                              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
                                                {formatPrice(item.discountPrice)}
                                              </span>
                                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 line-through">
                                                {formatPrice(item.price)}
                                              </span>
                                            </>
                                          ) : formatPrice(item.price) ? (
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                              {formatPrice(item.price)}
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}

                      {loading && (
                        <div className="flex justify-start">
                          <div className="flex items-center gap-2 bg-transparent px-0 py-0 text-sm text-slate-500">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
                          </div>
                        </div>
                      )}

                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                <div className="mx-auto w-full max-w-5xl">
                  <div className="rounded-[24px] border border-slate-200 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-end gap-2">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="Message Product Finder..."
                        className="max-h-[160px] min-h-[46px] flex-1 resize-none overflow-y-auto rounded-[18px] bg-transparent px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:text-[15px]"
                      />

                      <button
                        onClick={() => sendMessage()}
                        disabled={
                          loading ||
                          !activeConversationId ||
                          !isValidMongoId(currentUserId)
                        }
                        className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#0e3558] px-4 text-sm font-semibold text-white transition hover:bg-[#15466f] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 px-1 text-[11px] text-slate-400">
                    Enter to send, Shift + Enter for a new line.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default ChatBot;