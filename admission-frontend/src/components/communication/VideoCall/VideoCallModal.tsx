'use client';

import { useHMSActions, useHMSStore, selectPeers, selectIsConnectedToRoom } from '@100mslive/react-sdk';
import { useEffect, useState } from 'react';
import { VideoPeer } from './VideoPeer';

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
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (isConnected) {
                hmsActions.leave();
            }
        };
    }, [isConnected, hmsActions]);

    const toggleAudio = async () => {
        await hmsActions.setLocalAudioEnabled(!isMuted);
        setIsMuted(!isMuted);
    };

    const toggleVideo = async () => {
        await hmsActions.setLocalVideoEnabled(!isVideoOff);
        setIsVideoOff(!isVideoOff);
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

            {/* Controls */}
            <div className="p-8 flex items-center justify-center gap-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800">
                <button
                    onClick={toggleAudio}
                    className={`p-5 rounded-2xl transition-all transform hover:scale-110 shadow-lg ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    {isMuted ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={handleLeave}
                    className="p-5 bg-red-600 text-white rounded-3xl hover:bg-red-700 transition-all transform hover:scale-110 shadow-xl"
                >
                    <svg className="w-8 h-8 rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C10.12 18 2 9.88 2 3z" />
                    </svg>
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-5 rounded-2xl transition-all transform hover:scale-110 shadow-lg ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    {isVideoOff ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
