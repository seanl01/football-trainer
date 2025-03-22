import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code';
import { configuration } from '@lib/rtc';
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/football-trainer/pair/leader')({
  component: PairTrainer,
})

type ConnectionData = {
  sd?: RTCSessionDescription | RTCSessionDescriptionInit
  role: "leader" | "follower" | "unknown"
  iceCandidates: RTCIceCandidate[]
  connected: boolean
}

type FlashData = {
  flash: boolean
  flashComponent: React.ReactNode
  intervalCleanupId: number
  interval: number
  timeout: number
}

// make sure in line with original type
// const SentConnectionData: z.ZodType<ConnectionData> = z.object({
//   sd: z.object({
//     sdp: z.string(),
//     type: z.enum(["offer", "answer"])
//   }),
//   role: z.enum(["leader", "follower", "unknown"]),
//   iceCandidates: z.ZodType<RTCIceCandidate>.array()
// })

// type SessionDescription = z.infer<typeof SentConnectionData>

function randomChoice() {
  return Math.random() < 0.5;
}

function PairTrainer() {
  const pc = useRef(new RTCPeerConnection(configuration));
  const dataChannel = useRef(pc.current.createDataChannel("Signals"));
  const receiveChannel = useRef<RTCDataChannel | null>(null)
  const [data, setData] = useState<ConnectionData>({ role: "unknown", iceCandidates: [], connected: false });
  const [flashData, setFlashData] = useState<FlashData>({
    flash: false,
    flashComponent: null,
    intervalCleanupId: 0,
    interval: 5000,
    timeout: 2000
  });

  useEffect(() => {
    const onMount = async () => {
      // needed for ice candidate generation.

      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);

      // create offer and show in qr code
      setData(cur => ({ ...cur, sd: offer }));

      pc.current.addEventListener("icecandidate", handleIceCandidate);
      pc.current.addEventListener("connectionstatechange", handleConnectionStateChange);

    };
    onMount();

    return () => {
      cleanup()
    }

  }, [])

  const onScan = useCallback(async (barcodes: IDetectedBarcode[]) => {
    try {
      const barcode = barcodes[0];
      const qrData = JSON.parse(barcode.rawValue) as RTCSessionDescription

      console.log(qrData)

      // If scanned QR is an answer, we are the leader
      if (qrData?.type === "answer") {
        const answer = qrData
        const remoteDesc = new RTCSessionDescription(answer);
        await pc.current.setRemoteDescription(remoteDesc);

        dataChannel.current.addEventListener("open", handleChannelOpen)

        setData(cur => ({ ...cur, role: "leader" }));
        console.log("I am leader")

      }

      // We are follower
      else if (qrData?.type === "offer") {
        const offer = qrData;
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer))

        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        // Ready to receive messages
        pc.current.addEventListener("datachannel", handleDataChannel);

        // Display answer
        setData(cur => ({ ...cur, role: "follower", sd: answer }));
        console.log("I am follower")
      }

    }
    catch (e) {
      console.error(e)
    }

  }, [])

  function handleIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (event.candidate !== null) {
      setData(cur => ({
        ...cur,
        iceCandidates: [...cur.iceCandidates, event.candidate as RTCIceCandidate],
        sd: pc.current.currentLocalDescription ?? cur.sd // update sd QR upon added ice candidates
      }))
    }
  }

  function handleConnectionStateChange() {
    console.log("Connection state changed: ", pc.current.connectionState)
    setData(cur => ({ ...cur, connected: pc.current.connectionState === "connected" }))
  }

  function flash(timeout: number = flashData.timeout) {
    setFlashData(cur => ({ ...cur, flash: true })) // flash red

    setTimeout(() => {
      setFlashData(cur => ({ ...cur, flash: false }))
    }, timeout) // keep flash for 2.5s
  }

  function cleanup() {
    console.log("Unmounting PairTrainer")
    pc.current.removeEventListener("icecandidate", handleIceCandidate);
    pc.current.removeEventListener("connectionstatechange", handleConnectionStateChange);
    pc.current.close();
    dataChannel.current.close();
    receiveChannel.current?.close();
    clearInterval(flashData.intervalCleanupId)
  }

  function handleChannelOpen() {
    if (dataChannel.current.readyState === "open") {
      const intervalId = setInterval(() => {
        if (randomChoice()) {
          flash()
        }
        else {
          dataChannel.current.send("flash")
        }
      }, flashData.interval)

      setFlashData(cur => ({ ...cur, intervalCleanupId: intervalId }))
    }
  }

  function handleDataChannel(event: RTCDataChannelEvent) {
    receiveChannel.current = event.channel;
    receiveChannel.current.addEventListener("message", handleMessage);
  }

  function handleMessage(event: MessageEvent) {
    if (event.data === "flash") {
      flash();
    }
  }

  return (
    <section className="relative">
      <span>Ice candidate count: {data.iceCandidates.length} </span>
      {(data?.sd?.sdp && !data.connected) &&
        <>
          Type: {data?.sd?.type}
          <QRCode
            value={JSON.stringify(data.sd)}
            size={200}
            className="aspect-square bg-white p-2 rounded-md"
          />
        </>
      }
      <figure className="w-6/12">
        <Scanner
          onScan={onScan} // on scan, generate answer
        />
      </figure>

      <div className={cn("w-6/12 aspect-square bg-transparent", flashData.flash && "bg-red-700")}>

      </div>

      {/* {data?.offer && JSON.stringify(data.offer)} */}
    </section>
  )
}
