import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code';
import { configuration } from '@lib/rtc';
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { z } from 'zod';

export const Route = createFileRoute('/football-trainer/pair/leader')({
  component: PairTrainer,
})

type ConnectionData = {
  sd?: RTCSessionDescription | RTCSessionDescriptionInit
  role: "leader" | "follower" | "unknown"
  iceCandidates: RTCIceCandidate[]
  messages?: string[]
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

function PairTrainer() {
  const pc = useRef(new RTCPeerConnection(configuration));
  const dataChannel = useRef(pc.current.createDataChannel("Signals"));
  const receiveChannel = useRef<RTCDataChannel | null>(null)
  const [data, setData] = useState<ConnectionData>({ role: "unknown", iceCandidates: [], messages: [] });

  useEffect(() => {
    const onMount = async () => {
      // needed for ice candidate generation.

      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);

      // create offer and show in qr code
      setData(cur => ({ ...cur, sd: offer }));

      pc.current.addEventListener("icecandidate", event => {
        if (event.candidate !== null) {
          setData(cur => ({
            ...cur,
            iceCandidates: [...cur.iceCandidates, event.candidate as RTCIceCandidate],
            sd: pc.current.currentLocalDescription ?? cur.sd // update sd QR upon added ice candidates
          }))
        }
      })

      pc.current.addEventListener("connectionstatechange", event => {
        console.log("Connection state changed", pc.current.connectionState)
      })

    };

    onMount();
  }, [pc])


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

        dataChannel.current.addEventListener("open", () => {
          if (dataChannel.current.readyState === "open")
            dataChannel.current.send("Hello")
        })

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
        pc.current.addEventListener("datachannel", event => {
          receiveChannel.current = event.channel
          receiveChannel.current.addEventListener("message", (m) => {
            // add message
            setData(cur => ({ ...cur, messages: [...(cur.messages ?? []), m.data] }))
          });
        })

        // Display answer
        setData(cur => ({ ...cur, role: "follower", sd: answer }));
        console.log("I am follower")
      }

    }
    catch (e) {
      console.error(e)
    }

  }, [])

  return (
    <section>
      {(data?.sd?.sdp && data.iceCandidates.length > 3) &&
        <>
          Type: {data?.sd?.type}
          <QRCode
            value={JSON.stringify(data.sd)}
            size={400}
            className="ml-4 w-6/12 bg-white p-4"
          />
        </>
      }
      <figure className="w-6/12">
        <Scanner
          onScan={onScan} // on scan, generate answer
        />
      </figure>
      {data?.messages && data.messages.map(m => {
        return <span>{m}</span>
      })}

      {/* {data?.offer && JSON.stringify(data.offer)} */}
    </section>
  )
}
