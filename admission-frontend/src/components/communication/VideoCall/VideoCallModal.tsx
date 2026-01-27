'use client';

import { useHMSActions, useHMSStore, selectPeers, selectIsConnectedToRoom } from '@100mslive/react-sdk';
import { useEffect, useState } from 'react';
import { VideoPeer } from './VideoPeer';
import { MeetingChat } from './MeetingChat';
import { useAuthStore } from '@/store/authStore';

// Video call interface using 100ms SDK

interface VideoCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomName: string;
    isOutgoing?: boolean;
}

export function VideoCallModal({ isOpen, onClose, roomName, isOutgoing = false }: VideoCallModalProps) {
    const hmsActions = useHMSActions();
    const peers = useHMSStore(selectPeers);
    const isConnected = useHMSStore(selectIsConnectedToRoom);
    const { user } = useAuthStore();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (isConnected) {
                hmsActions.leave();
            }
        };
    }, [isConnected, hmsActions]);

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
        // For modal, we don't have a direct link, so just show a message
        alert('Cuộc gọi đang diễn ra trong ứng dụng');
    };

    const handleLeave = async () => {
        await hmsActions.leave();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 z-[10000] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg">{roomName}</h2>
                        <p className="text-xs text-slate-400 font-medium">{peers.length} thành viên đang tham gia</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-green-500 font-bold uppercase tracking-wider">Live</span>
                </div>
            </div>

            {/* Main Video Grid */}
            <div className="flex-1 p-6 overflow-hidden relative">
                {!isConnected && isOutgoing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10">
                        <div className="w-24 h-24 bg-purple-600 rounded-full animate-ping absolute opacity-20"></div>
                        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center relative shadow-2xl">
                            <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mt-8 mb-2">Đang gọi...</h3>
                        <p className="text-slate-400">Vui lòng đợi người khác tham gia</p>
                    </div>
                )}

                <div className={`grid gap-4 h-full ${peers.length <= 1 ? 'grid-cols-1' :
                    peers.length === 2 ? 'grid-cols-2' :
                        'grid-cols-2 md:grid-cols-3'
                    }`}>
                    {peers.map((peer: any) => (
                        <VideoPeer key={peer.id} peer={peer} />
                    ))}
                </div>
            </div>

            {/* Controls - Updated to match meeting page */}
            <div className="p-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800">
                <div className="flex items-center justify-between">
                    {/* Left - Meeting info */}
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Center - Main controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleAudio}
                            className={`p-4 rounded-full transition-all transform hover:scale-110 shadow-lg ${
                                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
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
                            className={`p-4 rounded-full transition-all transform hover:scale-110 shadow-lg ${
                                isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
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
                            className={`p-4 rounded-full transition-all transform hover:scale-110 shadow-lg ${
                                isScreenSharing ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                            title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </button>

                        <button
                            onClick={handleLeave}
                            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all transform hover:scale-110 shadow-xl"
                            title="Rời khỏi cuộc họp"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                            </svg>
                        </button>
                    </div>

                    {/* Right - Additional controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowParticipants(!showParticipants)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
                            title="Người tham gia"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>

                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
                            title="Chat"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Participants Sidebar */}
            {showParticipants && (
                <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 z-50 overflow-y-auto">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-white font-semibold">Người tham gia ({peers.length})</h3>
                        <button
                            onClick={() => setShowParticipants(false)}
                            className="p-1 hover:bg-slate-800 rounded"
                        >
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        {peers.map((peer) => (
                            <div key={peer.id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded">
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {peer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">{peer.name}</p>
                                    <p className="text-slate-400 text-xs">
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
