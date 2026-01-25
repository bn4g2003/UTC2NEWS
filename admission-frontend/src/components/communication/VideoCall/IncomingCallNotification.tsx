'use client';

interface IncomingCallNotificationProps {
    caller: {
        id: string;
        fullName: string;
        username: string;
    };
    roomName: string;
    onAccept: () => void;
    onDecline: () => void;
}

export function IncomingCallNotification({ caller, roomName, onAccept, onDecline }: IncomingCallNotificationProps) {
    return (
        <div className="fixed top-6 right-6 z-[11000] w-full max-w-sm animate-slide-in-right">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-200 dark:shadow-none">
                                {caller.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{caller.fullName}</h3>
                            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mt-1">Cuộc gọi video đến</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-6">
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Phòng chat</p>
                        <p className="text-sm text-slate-900 dark:text-white font-semibold truncate">{roomName}</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onDecline}
                            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 font-bold transition-all"
                        >
                            Từ chối
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold shadow-lg shadow-purple-200 dark:shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Chấp nhận
                        </button>
                    </div>
                </div>
                <div className="h-1 bg-purple-600 animate-progress-bar"></div>
            </div>
        </div>
    );
}
