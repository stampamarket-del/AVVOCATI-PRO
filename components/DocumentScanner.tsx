
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ScanIcon, LoadingIcon } from './icons';

interface DocumentScannerProps {
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Errore nell'accesso alla fotocamera:", err);
            let errorMessage = "Impossibile accedere alla fotocamera. Assicurati di aver dato i permessi necessari.";
            if (err instanceof DOMException) {
                switch (err.name) {
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        errorMessage = "Accesso alla fotocamera negato. Per utilizzare lo scanner, devi concedere il permesso nelle impostazioni del tuo browser per questo sito. Potrebbe essere necessario ricaricare la pagina dopo aver abilitato il permesso.";
                        break;
                    case 'NotFoundError':
                        errorMessage = "Nessuna fotocamera trovata. Assicurati che una fotocamera sia collegata e funzionante.";
                        break;
                    case 'NotReadableError':
                         errorMessage = "La fotocamera è già in uso da un'altra applicazione. Chiudi le altre app che potrebbero utilizzarla e riprova.";
                        break;
                    case 'PermissionDismissedError':
                        errorMessage = "Il permesso per la fotocamera è stato ignorato. Per favore, ricarica la pagina e concedi l'accesso quando richiesto.";
                        break;
                }
            }
            setError(errorMessage);
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [startCamera, stream]);

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                onCapture(dataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-secondary mb-4">Scansiona Documento</h2>
                
                <div className="relative bg-gray-900 rounded-md overflow-hidden min-h-[300px] flex justify-center items-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                    <canvas ref={canvasRef} className="hidden" />
                    {!stream && !error && (
                        <div className="absolute text-white flex flex-col items-center">
                            <LoadingIcon className="w-8 h-8 mb-2" />
                            <span>Avvio fotocamera...</span>
                        </div>
                    )}
                     {error && (
                        <div className="absolute inset-0 bg-red-900 bg-opacity-80 text-white p-4 flex flex-col justify-center items-center text-center">
                            <h3 className="font-bold text-lg mb-2">Errore Fotocamera</h3>
                            <p className="text-sm">{error}</p>
                        </div>
                     )}
                </div>

                <div className="flex justify-between items-center mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                    <button 
                        onClick={handleCapture} 
                        disabled={!stream || !!error}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400"
                    >
                        <ScanIcon />
                        Cattura Immagine
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentScanner;