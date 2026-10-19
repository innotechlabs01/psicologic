// Declaraciones WebRTC ausentes en lib.dom (TS 5.3), reutilizando los tipos
// que lib.dom ya define (RTCRtpCapabilities, RTCRtpCodec).
// Ref: https://w3c.github.io/webrtc-extensions/#rtcrtpreceiver-getcapabilities
// Usadas por src/components/Agenda/hooks/useWebRTC.ts.
interface RTCRtpReceiver {
  getCapabilities?(kind?: string): RTCRtpCapabilities | null;
}

interface RTCRtpTransceiver {
  readonly kind?: "audio" | "video";
}
