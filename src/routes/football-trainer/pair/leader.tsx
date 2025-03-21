import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
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
  const [pc, _] = useState(new RTCPeerConnection(configuration));
  const [data, setData] = useState<ConnectionData>({ role: "unknown", iceCandidates: [] });

  useEffect(() => {
    const onMount = async () => {
      // needed for ice candidate generation.
      pc.createDataChannel("Signals")

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // create offer and show in qr code
      setData(cur => ({ ...cur, sd: offer }));

      pc.addEventListener("icecandidate", event => {
        if (event.candidate !== null) {
          setData(cur => ({
            ...cur,
            iceCandidates: [...cur.iceCandidates, event.candidate as RTCIceCandidate],
            sd: pc.currentLocalDescription ?? cur.sd
          }))
        }
      })

      pc.addEventListener("connectionstatechange", event => {
        console.log(pc.connectionState)
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
        await pc.setRemoteDescription(remoteDesc);

        // for (const candidate of qrData.iceCandidates) {
        //   pc.addIceCandidate(candidate)
        // }

        setData(cur => ({ ...cur, role: "leader" }));
        console.log("I am leader")
      }

      else if (qrData?.type === "offer") {
        const offer = qrData;
        await pc.setRemoteDescription(new RTCSessionDescription(offer))

        // for (const candidate of qrData.iceCandidates) {
        //   pc.addIceCandidate(candidate)
        // }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

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
            // value={import.meta.env.BASE_URL + "pair/follower?sdp=" + encodeURIComponent(data.sd.sdp)}
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

      {/* {data?.offer && JSON.stringify(data.offer)} */}
    </section>
  )
}
