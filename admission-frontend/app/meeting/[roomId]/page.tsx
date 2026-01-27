'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHMSActions, useHMSStore, selectPeers, selectIsConnectedToRoom } from '@100mslive/react-sdk';
import { useAuthStore } from '@/store/authStore';
import { VideoPeer } from '@/components/communication/VideoCall/VideoPeer';
import { MeetingChat } from '@/components/communication/VideoCall/MeetingChat';

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const { user, token } = useAuthStore();
  const hmsActions = useHMSActions();
  const peers = useHMSStore(selectPeers);
  const isConnected = useHMSStore(selectIsConnectedToRoom);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Wait a bit for auth store to hydrate from localStorage
    const timer = setTimeout(() => {
      const { token: currentToken, user: currentUser } = useAuthStore.getState();
      
      if (!currentToken || !currentUser) {
        // If still no token after hydration, middleware will redirect
        // This shouldn't show error, just keep loading
        return;
      }

      const joinMeeting = async () => {
        try {
          setIsJoining(true);
          
          // Get HMS token from backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/video/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ roomId })
          });

          if (!response.ok) {
            throw new Error('Không thể lấy token cuộc họp');
          }

          const { token: hmsToken } = await response.json();

          // Join HMS room
          await hmsActions.join({
            userName: currentUser.fullName || 'User',
            authToken: hmsToken,
          });

          setIsJoining(false);
        } catch (err: any) {
          console.error('Failed to join meeting:', err);
          setError(err.message || 'Không thể tham gia cuộc họp');
          setIsJoining(false);
        }
      };

      joinMeeting();
    }, 100); // Small delay for hydration

    return () => {
      clearTimeout(timer);
      if (isConnected) {
        hmsActions.leave();
      }
    };
  }, [roomId, hmsActions, isConnected]);

  // Sync local state with HMS state
  useEffect(() => {
    const localPeer = peers.find(peer => peer.isLocal);
    if (localPeer) {
      setIsMuted(!localPeer.audioTrack);
      setIsVideoOff(!localPeer.videoTrack);
    }
  }, [peers]);

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(!isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        await hmsActions.setScreenShareEnabled(true);
        setIsScreenSharing(true);
      } else {
        await hmsActions.setScreenShareEnabled(false);
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Screen share error:', error);
      alert('Không thể chia sẻ màn hình');
    }
  };

  const copyMeetingLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Đã sao chép link cuộc họp!');
  };

  const handleLeave = async () => {
    await hmsActions.leave();
    // Close tab if opened from meeting link, otherwise go to chat
    if (window.opener) {
      window.close();
    } else {
      router.push('/chat');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.opener ? window.close() : router.push('/chat')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {window.opener ? 'Đóng' : 'Quay lại Chat'}
          </button>
        </div>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang tham gia cuộc họp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-semibold">Cuộc họp video</h1>
              <p className="text-gray-400 text-sm">{peers.length} người tham gia</p>
            </div>
          </div>
          
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {window.opener ? 'Đóng' : 'Quay lại Chat'}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 overflow-auto">
        {peers.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg">Đang chờ người khác tham gia...</p>
            </div>
          </div>
        ) : (
          <div className={`grid gap-4 h-full ${
            peers.length === 1 ? 'grid-cols-1' :
            peers.length === 2 ? 'grid-cols-2' :
            peers.length <= 4 ? 'grid-cols-2 grid-rows-2' :
            peers.length <= 6 ? 'grid-cols-3 grid-rows-2' :
            'grid-cols-3 grid-rows-3'
          }`}>
            {peers.map((peer) => (
              <VideoPeer key={peer.id} peer={peer} />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Meeting info */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Center - Main controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isMuted ? 'Bật mic' : 'Tắt mic'}
            >
              {isMuted ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isVideoOff ? 'Bật camera' : 'Tắt camera'}
            >
              {isVideoOff ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-colors ${
                isScreenSharing ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            <button
              onClick={handleLeave}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
              title="Rời khỏi cuộc họp"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>

          {/* Right side - Additional controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
              title="Người tham gia"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
              title="Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>

            <button
              onClick={copyMeetingLink}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
              title="Sao chép link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Participants Sidebar */}
      {showParticipants && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 z-50 overflow-y-auto">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Người tham gia ({peers.length})</h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 space-y-2">
            {peers.map((peer) => (
              <div key={peer.id} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {peer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{peer.name}</p>
                  <p className="text-gray-400 text-xs">
                    {peer.audioTrack ? '🎤' : '🔇'} {peer.videoTrack ? '📹' : '📷'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Chat */}
      <MeetingChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentUserName={user?.fullName || 'User'}
      />
    </div>
  );
}
