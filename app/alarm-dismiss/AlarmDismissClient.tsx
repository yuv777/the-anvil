'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'

export default function AlarmDismissClient({ userId, requireQr = false }: { userId: string; requireQr?: boolean }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const beepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [scanning, setScanning] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [time, setTime] = useState('')
  const [showEmergency, setShowEmergency] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStart = useRef<number>(0)

  // Live clock
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Alarm beep
  useEffect(() => {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    audioCtxRef.current = ctx

    function beep() {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return
      const osc = audioCtxRef.current.createOscillator()
      const gain = audioCtxRef.current.createGain()
      osc.connect(gain)
      gain.connect(audioCtxRef.current.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime)
      osc.frequency.setValueAtTime(660, audioCtxRef.current.currentTime + 0.15)
      gain.gain.setValueAtTime(0.25, audioCtxRef.current.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.35)
      osc.start(audioCtxRef.current.currentTime)
      osc.stop(audioCtxRef.current.currentTime + 0.35)
    }

    beep()
    beepIntervalRef.current = setInterval(beep, 900)

    return () => {
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current)
      ctx.close()
    }
  }, [])

  const dismiss = useCallback(() => {
    if (dismissed) return
    setDismissed(true)
    if (beepIntervalRef.current) clearInterval(beepIntervalRef.current)
    if (audioCtxRef.current) audioCtxRef.current.close()
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    const video = videoRef.current
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    }
    setTimeout(() => router.push('/dashboard'), 1500)
  }, [dismissed, router])

  // QR scan loop
  useEffect(() => {
    if (!scanning) return
    scanIntervalRef.current = setInterval(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code?.data === userId) dismiss()
    }, 200)
    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current) }
  }, [scanning, userId, dismiss])

  // Auto-start camera only for QR alarms
  useEffect(() => {
    if (!requireQr) return
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setScanning(true)
        }
      } catch {
        setCameraError(true)
      }
    }
    start()
  }, [requireQr])

  if (dismissed) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-7xl mb-6 fade-in-up" style={{ color: 'var(--green)' }}>✓</div>
        <p className="text-2xl font-black fade-in-up" style={{ color: 'var(--green)' }}>Good morning!</p>
        <p className="text-sm mt-2 fade-in-up" style={{ color: 'var(--text-3)' }}>Heading to dashboard…</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#080808' }}>
      {/* Top */}
      <div className="flex flex-col items-center pt-16 pb-6">
        <div className="text-5xl font-black tracking-tight mb-2" style={{ color: '#f87171' }}>ALARM</div>
        <div className="text-3xl font-bold" style={{ color: 'var(--text-2)' }}>{time}</div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
        {!requireQr ? (
          /* Simple dismiss button for non-QR alarms */
          <button
            onClick={dismiss}
            className="w-64 h-64 rounded-full flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
            style={{ background: 'rgba(248,113,113,0.1)', border: '3px solid #f87171' }}
          >
            <span className="text-5xl font-black" style={{ color: '#f87171' }}>STOP</span>
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>Tap to dismiss</span>
          </button>
        ) : cameraError ? (
          <div className="text-center space-y-3">
            <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>Camera access needed</p>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Go to Settings → The Anvil → Camera → Allow
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-center" style={{ color: 'var(--text-2)' }}>
              Point camera at your QR code
            </p>
            <div
              className="relative rounded-3xl overflow-hidden w-64 h-64"
              style={{ border: '2px solid var(--green)', boxShadow: '0 0 30px rgba(34,197,94,0.2)' }}
            >
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {[
                'top-3 left-3 border-t-2 border-l-2',
                'top-3 right-3 border-t-2 border-r-2',
                'bottom-3 left-3 border-b-2 border-l-2',
                'bottom-3 right-3 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 ${cls}`} style={{ borderColor: 'var(--green)', borderRadius: 2 }} />
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
              Dismisses automatically when scanned
            </p>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Footer — emergency dismiss only relevant for QR alarms */}
      {requireQr && (
        <div className="pb-14 flex flex-col items-center gap-4">
          {!showEmergency ? (
            <>
              <button
                onClick={() => setShowEmergency(true)}
                className="text-xs underline"
                style={{ color: 'var(--text-3)' }}
              >
                Lost your QR code? Emergency dismiss
              </button>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Find your QR code in Settings → Sleep Alarms
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 px-8 w-full">
              <p className="text-xs text-center" style={{ color: '#f87171' }}>
                Hold for 3 seconds to dismiss without QR
              </p>
              <div className="relative w-full max-w-xs" style={{ height: 52 }}>
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: '#f87171', width: `${holdProgress}%`, borderRadius: 16, opacity: 0.25 }}
                />
                <button
                  onPointerDown={() => {
                    holdStart.current = Date.now()
                    holdTimer.current = setInterval(() => {
                      const pct = Math.min(100, ((Date.now() - holdStart.current) / 3000) * 100)
                      setHoldProgress(pct)
                      if (pct >= 100) { if (holdTimer.current) clearInterval(holdTimer.current); dismiss() }
                    }, 30)
                  }}
                  onPointerUp={() => { if (holdTimer.current) clearInterval(holdTimer.current); setHoldProgress(0) }}
                  onPointerLeave={() => { if (holdTimer.current) clearInterval(holdTimer.current); setHoldProgress(0) }}
                  className="absolute inset-0 w-full h-full rounded-2xl font-bold text-sm"
                  style={{ background: 'transparent', border: '1px solid #f87171', color: '#f87171' }}
                >
                  Hold to dismiss
                </button>
              </div>
              <button onClick={() => { setShowEmergency(false); setHoldProgress(0) }} className="text-xs" style={{ color: 'var(--text-3)' }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
