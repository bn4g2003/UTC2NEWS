'use client';

import { useVideo, useHMSStore, selectVideoTrackByPeerID } from '@100mslive/react-sdk';
import { useRef, useEffect } from 'react';

/**
 * Component to display a single peer's video stream
 */
export function VideoPeer({ peer }: { peer: any }) {
    const { videoRef } = useVideo({
        trackId: peer.videoTrack,
    });
    const videoTrack = useHMSStore(selectVideoTrackByPeerID(peer.id));

    return (
        <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 transition-all hover:border-purple-500/50">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${peer.isLocal ? 'mirror' : ''}`}
            />

            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                <p className="text-white text-xs font-bold flex items-center gap-2">
                    {peer.name} {peer.isLocal ? '(Bạn)' : ''}
                    {!peer.audioTrack && (
                        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                        </svg>
                    )}
                </p>
            </div>

            {!videoTrack?.enabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-2xl bg-gradient-to-br from-purple-500 to-blue-600`}>
                        {peer.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}
        </div>
    );
}
