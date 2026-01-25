'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHMSActions } from '@100mslive/react-sdk';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/store/authStore';
import { VideoCallModal } from './VideoCallModal';
import { IncomingCallNotification } from './IncomingCallNotification';

export function VideoCallManager() {
    const { initiateCall, respondToCall, endCall } = useChat();
    const { user, token } = useAuthStore();
    const hmsActions = useHMSActions();

    const [callSession, setCallSession] = useState<any>(null); // { roomId, callId, caller, isOutgoing, hmsRoomId }
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any>(null);

    // Handle incoming call invitation
    useEffect(() => {
        const handleIncomingCall = (event: any) => {
            const data = event.detail;
            // Don't show if already in a call
            if (callSession || incomingCall) return;
            setIncomingCall(data);

            // Auto-decline after 30 seconds if no response
            setTimeout(() => {
                setIncomingCall((prev: any) => {
                    if (prev && prev.callId === data.callId) {
                        return null;
                    }
                    return prev;
                });
            }, 30000);
        };

        window.addEventListener('call:incoming', handleIncomingCall);
        return () => window.removeEventListener('call:incoming', handleIncomingCall);
    }, [callSession, incomingCall]);

    // Handle call status updates (acceptance/declination)
    useEffect(() => {
        const handleStatusUpdate = async (event: any) => {
            const data = event.detail;
            if (callSession && callSession.callId === data.callId) {
                if (data.accept) {
                    console.log('Call accepted by:', data.userId);
                    // If we are the caller, we might need to join the room now if we haven't
                    if (callSession.isOutgoing && !isModalOpen) {
                        joinHMSRoom(data.hmsRoomId);
                    }
                } else {
                    console.log('Call declined by:', data.userId);
                    // If 1-1 and declined, end call
                    if (callSession.type === 'DIRECT') {
                        setIsModalOpen(false);
                        setCallSession(null);
                    }
                }
            }
        };

        window.addEventListener('call:status:update', handleStatusUpdate);
        return () => window.removeEventListener('call:status:update', handleStatusUpdate);
    }, [callSession, isModalOpen]);

    // Handle initiate call event from UI (e.g. Chat Header)
    useEffect(() => {
        const handleStartCall = async (event: any) => {
            const { roomId, roomName, type } = event.detail;

            try {
                // 1. Create room in backend/100ms
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/video/rooms`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: `Call ${roomName}`, description: `Call in ${roomName}` })
                });

                const data = await response.json();

                // 2. Initiate signaling
                const initiateData = {
                    roomId,
                    roomName,
                    type,
                    hmsRoomId: data.hmsRoomId
                };

                // We need to update useChat to accept hmsRoomId or just emit manually
                // For simplicity, I'll update useChat or emit here if useChat is updated
                const eventEmit = new CustomEvent('call:initiate:emit', { detail: initiateData });
                window.dispatchEvent(eventEmit);

                // 3. Set local session
                setCallSession({
                    roomId,
                    roomName,
                    type,
                    isOutgoing: true,
                    hmsRoomId: data.hmsRoomId
                });

                // 4. Open modal and join
                joinHMSRoom(data.hmsRoomId);
            } catch (error) {
                console.error('Failed to start call:', error);
                alert('Không thể bắt đầu cuộc gọi video');
            }
        };

        window.addEventListener('call:start:request', handleStartCall);
        return () => window.removeEventListener('call:start:request', handleStartCall);
    }, [token, initiateCall]);

    const joinHMSRoom = async (hmsRoomId: string) => {
        try {
            // 1. Get token from backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/video/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roomId: hmsRoomId })
            });

            const { token: hmsToken } = await response.json();

            // 2. Join using HMS Actions
            await hmsActions.join({
                userName: user?.fullName || 'User',
                authToken: hmsToken,
            });

            setIsModalOpen(true);
        } catch (error) {
            console.error('Failed to join HMS room:', error);
        }
    };

    const handleAccept = () => {
        if (!incomingCall) return;

        // 1. Send acceptance signal
        respondToCall(incomingCall.roomId, incomingCall.callId, true);

        // 2. Set session and join
        setCallSession({
            ...incomingCall,
            isOutgoing: false
        });
        setIncomingCall(null);

        // Note: In a real app, the caller should provide the hmsRoomId in the invitation or we get it from a session
        // For now we'll assume it's part of the invitation data if we implement it that way
        if (incomingCall.hmsRoomId) {
            joinHMSRoom(incomingCall.hmsRoomId);
        } else {
            // Need to fetch it if not provided
            alert('Đang kết nối...');
        }
    };

    const handleDecline = () => {
        if (!incomingCall) return;
        respondToCall(incomingCall.roomId, incomingCall.callId, false);
        setIncomingCall(null);
    };

    return (
        <>
            {incomingCall && (
                <IncomingCallNotification
                    caller={incomingCall.caller}
                    roomName={incomingCall.roomName}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                />
            )}

            {callSession && (
                <VideoCallModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setCallSession(null);
                    }}
                    roomName={callSession.roomName}
                    isOutgoing={callSession.isOutgoing}
                />
            )}
        </>
    );
}
