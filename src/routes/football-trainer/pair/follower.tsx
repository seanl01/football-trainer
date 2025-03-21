import { configuration } from '@/lib/rtc';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { z } from 'zod';

const sdpSchema = z.object({
  sdp: z.string()
})

export const Route = createFileRoute('/football-trainer/pair/follower')({
  component: PairTrainer,
  validateSearch: sdpSchema
})

type ConnectionData = {
  offer: RTCSessionDescriptionInit
}

function PairTrainer() {
  const { sdp } = Route.useSearch();

  const [pc, _] = useState(new RTCPeerConnection(configuration));
  const [data, setData] = useState<Partial<ConnectionData>>({});

  useEffect(() => {
    const onMount = async () => {
      const offer = {
        sdp,
        type: "offer" as RTCSdpType
      }

      pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setData(cur => ({ ...cur, offer }));

      // create offer and show in qr code
    };

    onMount();
  }, [pc])

  return (
    <section>

    </section>
  )
}
