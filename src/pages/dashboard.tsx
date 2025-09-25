import { useEffect, useState } from "react";
import { Meta } from "@/components/meta";
import { Message } from "@/features/messages/messages";

export default function Dashboard() {
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    userMessages: 0,
    assistantMessages: 0,
    averageMessageLength: 0,
  });

  useEffect(() => {
    // Load chat history from localStorage
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      const log = params.chatLog ?? [];
      setChatLog(log);

      // Calculate statistics
      const userMsgs = log.filter((m: Message) => m.role === "user");
      const assistantMsgs = log.filter((m: Message) => m.role === "assistant");
      const totalLength = log.reduce((acc: number, m: Message) => acc + m.content.length, 0);

      setStats({
        totalMessages: log.length,
        userMessages: userMsgs.length,
        assistantMessages: assistantMsgs.length,
        averageMessageLength: log.length > 0 ? Math.round(totalLength / log.length) : 0,
      });
    }
  }, []);

  const exportChatLog = () => {
    const dataStr = JSON.stringify(chatLog, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `chatlog_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearChatHistory = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      params.chatLog = [];
      window.localStorage.setItem("chatVRMParams", JSON.stringify(params));
      setChatLog([]);
      setStats({
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        averageMessageLength: 0,
      });
    }
  };

  return (
    <div className="font-M_PLUS_2 bg-gray-50 min-h-screen">
      <Meta />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ChatVRM Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your conversation history</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
            <div className="text-gray-600">Total Messages</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.userMessages}</div>
            <div className="text-gray-600">Your Messages</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.assistantMessages}</div>
            <div className="text-gray-600">AI Responses</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">{stats.averageMessageLength}</div>
            <div className="text-gray-600">Avg. Message Length</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Chat
            </button>
            <button
              onClick={exportChatLog}
              disabled={chatLog.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Export Chat Log
            </button>
            <button
              onClick={clearChatHistory}
              disabled={chatLog.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Conversations</h2>
          {chatLog.length === 0 ? (
            <p className="text-gray-500">No conversation history yet</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {chatLog.slice(-10).reverse().map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-50 border-l-4 border-blue-400'
                      : 'bg-gray-50 border-l-4 border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="text-gray-700">{message.content.substring(0, 200)}
                    {message.content.length > 200 && '...'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}