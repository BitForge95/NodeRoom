import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient.js";

function App() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);

  const chatContainerRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    if (!session?.user) {
      setUsersOnline([]);
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error) setMessages(data);
    };
    loadMessages();

    const roomOne = supabase.channel("room_one", {
      config: { presence: { key: session?.user?.id } },
    });

    channelRef.current = roomOne;

    roomOne.on("broadcast", { event: "message" }, (payload) => {
      setMessages((prev) => [...prev, payload.payload]);
    });

    roomOne.on("presence", { event: "sync" }, () => {
      const state = roomOne.presenceState();
      setUsersOnline(Object.keys(state));
    });

    roomOne.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await roomOne.track({ id: session?.user?.id });
      }
    });

    return () => {
      roomOne.unsubscribe();
    };
  }, [session]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      message: newMessage,
      user_name: session?.user?.user_metadata?.email,
      avatar: session?.user?.user_metadata?.avatar_url,
      timestamp: new Date().toISOString(),
    };

    await supabase.from("messages").insert([
      {
        user_id: session?.user?.id,
        user_name: message.user_name,
        avatar: message.avatar,
        content: message.message,
      },
    ]);

    channelRef.current.send({
      type: "broadcast",
      event: "message",
      payload: message,
    });

    setMessages((prev) => [...prev, { ...message }]);
    setNewMessage("");
  };

  const formatTime = (isoString) =>
    new Date(isoString).toLocaleTimeString("en-us", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!session) {
    return (
      <div className="w-full h-screen flex justify-center items-center relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0 opacity-15">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #00ff41 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, #00ff41 0%, transparent 50%),
                               radial-gradient(circle at 50% 50%, #0066cc 0%, transparent 50%)`,
              backgroundSize: "120px 120px, 180px 180px, 240px 240px",
              animation: "pulse 6s ease-in-out infinite alternate",
            }}
          ></div>
        </div>

        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)`,
              backgroundSize: "25px 25px",
            }}
          ></div>
        </div>

        <div className="absolute inset-0 overflow-hidden opacity-15">
          <div className="absolute top-10 left-10 text-green-400 font-mono text-xs animate-pulse">
            {"{"}
            <br />
            &nbsp;&nbsp;"status": "online",<br />
            &nbsp;&nbsp;"users": 42<br />
            {"}"}
          </div>
          <div
            className="absolute top-20 right-10 text-blue-400 font-mono text-xs animate-pulse"
            style={{ animationDelay: "1s" }}
          >
            function connect() {"{"}
            <br />
            &nbsp;&nbsp;return true;
            <br />
            {"}"}
          </div>
          <div
            className="absolute bottom-32 left-20 text-cyan-400 font-mono text-xs animate-pulse"
            style={{ animationDelay: "2s" }}
          >
            console.log('connected');
            <br />
            // NodeRoom v2.0
          </div>
          <div
            className="absolute bottom-20 right-16 text-purple-400 font-mono text-xs animate-pulse"
            style={{ animationDelay: "3s" }}
          >
            &lt;Chat /&gt;
            <br />
            &lt;Users online={"{"}42{"}"} /&gt;
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-gray-800/15 border border-green-500/25 rounded-3xl p-12 shadow-2xl relative z-10">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-green-400 mb-2 font-mono">
                Welcome to NodeRoom
              </h1>
              <p className="text-green-300/80 text-lg font-mono">
                // Where developers merge ideas and compile connections
              </p>
            </div>
            <button
              onClick={signIn}
              className="px-8 py-4 bg-green-600/20 hover:bg-green-600/30 text-green-300 hover:text-green-200 rounded-xl border border-green-500/30 transform hover:scale-105 transition-all duration-200 flex items-center gap-3 mx-auto font-mono"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google to join NodeRoom
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex justify-center items-center relative overflow-hidden bg-gray-900">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #00ff41 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, #00ff41 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, #0066cc 0%, transparent 50%)`,
            backgroundSize: "100px 100px, 150px 150px, 200px 200px",
            animation: "pulse 4s ease-in-out infinite alternate",
          }}
        ></div>
      </div>

      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        ></div>
      </div>

      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 text-green-400 font-mono text-xs animate-pulse">
          {"{"}
          <br />
          &nbsp;&nbsp;"status": "online",<br />
          &nbsp;&nbsp;"users": 42<br />
          {"}"}
        </div>
        <div className="absolute top-20 right-10 text-blue-400 font-mono text-xs animate-pulse animation-delay-1000">
          function connect() {"{"}
          <br />
          &nbsp;&nbsp;return true;
          <br />
          {"}"}
        </div>
        <div className="absolute bottom-32 left-20 text-cyan-400 font-mono text-xs animate-pulse animation-delay-2000">
          console.log('connected');
          <br />
          // NodeRoom v2.0
        </div>
        <div className="absolute bottom-20 right-16 text-purple-400 font-mono text-xs animate-pulse animation-delay-3000">
          &lt;Chat /&gt;
          <br />
          &lt;Users online={"{"}42{"}"} /&gt;
        </div>
      </div>

      <div className="w-full max-w-5xl h-[90vh] backdrop-blur-sm bg-gray-800/90 border border-green-500/20 rounded-3xl overflow-hidden flex flex-col shadow-2xl ring-1 ring-green-400/10 relative z-10">
        <div className="bg-gray-800/95 border-b border-green-500/20 flex justify-between items-center h-20 px-6">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
              <span className="text-black font-bold text-lg">{"<>"}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-400 mb-1 font-mono">
                NodeRoom
              </h1>
              <p className="text-green-300/70 text-xs font-mono">
                // Where developers merge ideas and compile connections
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-green-100 font-semibold font-mono">
                {session?.user?.user_metadata?.full_name}
              </p>
              <div className="flex items-center justify-end space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-300/70 text-sm font-mono">
                  {usersOnline.length} noders online
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg border border-red-500/30 transition-all duration-200 font-medium font-mono"
            >
              Sign out
            </button>
          </div>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 p-6 flex flex-col overflow-y-auto space-y-4"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex w-full items-end space-x-3 ${
                msg?.user_name === session?.user?.user_metadata?.email
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {msg?.user_name !== session?.user?.user_metadata?.email && (
                <img
                  src={msg?.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-green-500/20 shadow-lg flex-shrink-0"
                />
              )}

              <div
                className={`flex flex-col max-w-[70%] ${
                  msg?.user_name === session?.user?.user_metadata?.email
                    ? "items-end"
                    : "items-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl shadow-lg border ${
                    msg?.user_name === session?.user?.user_metadata?.email
                      ? "bg-green-600/90 text-white rounded-br-md border-green-500/30"
                      : "bg-gray-700/90 backdrop-blur-sm text-gray-100 rounded-bl-md border-gray-600/30"
                  }`}
                >
                  <p className="text-sm leading-relaxed break-words font-mono">
                    {msg.content || msg.message}
                  </p>
                </div>
                <div
                  className={`text-xs text-gray-500 pt-1 px-2 font-mono ${
                    msg?.user_name === session?.user?.user_metadata?.email
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  // {formatTime(msg?.created_at || msg?.timestamp)}
                </div>
              </div>

              {msg?.user_name === session?.user?.user_metadata?.email && (
                <img
                  src={msg?.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-green-500/20 shadow-lg flex-shrink-0"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row p-4 border-t border-green-500/20 bg-gray-800/95 space-y-3 sm:space-y-0 sm:space-x-4">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            type="text"
            placeholder="// Type your code here..."
            className="flex-1 p-3 bg-gray-700/50 border border-green-500/20 rounded-xl text-green-100 placeholder-green-400/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 font-mono"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-semibold rounded-xl shadow-lg shadow-green-500/25 transform hover:scale-105 transition-all duration-200 min-w-[80px]"
          >
            <svg
              className="w-5 h-5 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
