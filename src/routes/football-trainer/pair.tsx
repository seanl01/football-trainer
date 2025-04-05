import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { configuration } from '@lib/rtc';
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { cn } from '@/lib/utils';
import { Responsive } from '@/components/responsive';
import { Connected } from '@/components/connected';
import { Slider } from '@/components/slider';
import { Pause, PersonStanding, Play, type LucideProps } from 'lucide-react';
import footballSvg from "@/assets/football.svg"
import { Nav } from '@/components/nav';

export const Route = createFileRoute('/football-trainer/pair')({
  component: PairTrainer,
})

type ConnectionData = {
  sd?: RTCSessionDescription | RTCSessionDescriptionInit
  role: "leader" | "follower" | "unknown"
  iceCandidates: RTCIceCandidate[]
  connected: boolean
}

export type FlashData = {
  flashComponent: React.ReactNode
  isFlashPlaying: boolean
  iconName: "ball" | "player"
  timeoutCleanupId: number
  minIntervalSecs: number
  maxIntervalSecs: number
  timeoutSecs: number
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

const icons = {
  ball: (props: LucideProps) => <img src={footballSvg} alt="football" className={props.className} />,
  player: (props: LucideProps) => <PersonStanding {...props} />,
}

function PairTrainer() {
  const pc = useRef(new RTCPeerConnection(configuration));
  const dataChannel = useRef(pc.current.createDataChannel("Signals"));
  const receiveChannel = useRef<RTCDataChannel | null>(null)
  const [data, setData] = useState<ConnectionData>({ role: "unknown", iceCandidates: [], connected: false });
  const [flashData, setFlashData] = useState<FlashData>({
    flashComponent: null,
    isFlashPlaying: false,
    timeoutCleanupId: 0,
    iconName: "ball",
    minIntervalSecs: 3,
    maxIntervalSecs: 3,
    timeoutSecs: 1
  });

  const flashDataRef = useRef(flashData);
  const [flashOn, setFlashOn] = useState(false);
  const [inScanMode, setInScanMode] = useState(false);

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
        pc.current.addEventListener("datachannel", startReceiveFlashing);

        // Display answer
        setData(cur => ({ ...cur, role: "follower", sd: answer }));
        setInScanMode(false) // show QR

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

  function flash(timeout: number = flashData.timeoutSecs) {
    setFlashOn(true) // flash red

    setTimeout(() => {
      setFlashOn(false)
    }, timeout * 1000) // keep flash for 2.5s
  }

  function cleanup() {
    console.log("Unmounting PairTrainer")
    pc.current.removeEventListener("icecandidate", handleIceCandidate);
    pc.current.removeEventListener("connectionstatechange", handleConnectionStateChange);
    pc.current.close();
    dataChannel.current.close();
    receiveChannel.current?.close();
    flashDataRef.current.isFlashPlaying = false;
    clearTimeout(flashDataRef.current.timeoutCleanupId)
  }

  useEffect(() => {
    flashDataRef.current = flashData;
  }, [flashData])

  function startFlashing() {
    if (dataChannel.current.readyState === "open") {
      const updated = { ...flashData, isFlashPlaying: true }
      setFlashData(updated)
      dataChannel.current.send(JSON.stringify(updated)) // send settings

      flashDataRef.current.isFlashPlaying = true;

      // const intervalId = setInterval(() => {
      //   if (randomChoice()) {
      //     flash()
      //   }
      //   else {
      //     dataChannel.current.send("flash")
      //   }
      // }, flashData.minIntervalSecs * 1000)

      function createTimeout() {
        if (!flashDataRef.current.isFlashPlaying) return;

        if (randomChoice()) {
          flash()
        }
        else {
          dataChannel.current.send("flash")
        }
        const interval = (flashData.minIntervalSecs + Math.random() *
          (flashData.maxIntervalSecs - flashData.minIntervalSecs)) * 1000;

        const timeout = setTimeout(createTimeout, interval)
        setFlashData(cur => ({ ...cur, timeoutCleanupId: timeout }))
        flashDataRef.current.timeoutCleanupId = timeout
      }

      createTimeout();
    }
  }

  function stopFlashing() {
    setFlashData(cur => ({ ...cur, isFlashPlaying: false }))
    // clear Interval
    clearTimeout(flashData.timeoutCleanupId)
  }

  function startReceiveFlashing(event: RTCDataChannelEvent) {
    receiveChannel.current = event.channel;
    receiveChannel.current.addEventListener("message", receiveFlash);
  }

  function receiveFlash(event: MessageEvent) {
    if (!flashData.isFlashPlaying)
      setFlashData(cur => ({ ...cur, isFlashPlaying: true }))

    if (event.data === "flash") {
      flash();
      return;
    }

    try {
      const receivedFlashData = JSON.parse(event.data)
      setFlashData(receivedFlashData)
    }
    catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <Nav backLink="/football-trainer" backText="Home" infoTitle="Pair trainer" infoContent={
        <div className="flex flex-col gap-2 ">
          <section className="text-sm text-base-content/70 my-2">
            <p>Pair two devices for a dynamic training experience. Each device can be placed around your training area, and will take turns flashing. You can set things like the min and maximum interval between flashes. <br />For best results, use devices on the same network (Wifi or Hotspot)</p>
            <div className="badge badge-soft badge-info mt-2 text-xs">ICE CANDIDATE COUNT: {data.iceCandidates.length}</div>
            <div className="divider"></div>
            <ol className="*:my-1">
              <li>1. With the first device, scan the second device's QR code by toggling to "Scan QR"</li>
              <li>2. Now use the second dvice to scan the QR code of the first device</li>
              <li>3. Your devices should now be connected.</li>
              <li>4. Configure settings of your training session. Click play to start.</li>
            </ol>
          </section>
        </div>
      } />
      <section className="relative grid grid-cols-1 gap-4">
        {/* name of each tab group should be unique */}
        <Connected isConnected={data.connected} className="w-3/6 place-self-center shadow-md"></Connected>

        {
          data.connected &&
          (flashData.isFlashPlaying ? <>
            {/* Webkit for iPhone compatability */}
            <div className={cn("w-8/12 aspect-3/5 place-self-center transition-all [-webkit-transform:translateZ(0)]", {
              "opacity-100 scale-100": flashOn,
              "opacity-0 scale-50": !flashOn
            })}>
              {/*  This is the icon */}
              {icons[flashData.iconName]({ className: "w-full h-full drop-shadow-[0px_0px_32px_var(--color-success)]" })}
            </div>
          </> : <p className="w-8/12 aspect-3/5 place-self-center grid place-items-center text-center text-md text-base-content/70">Click start</p>)
        }

        {!data.connected &&
          <>
            <section className="flex items-center justify-center">

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text text-sm text-base-content">Show QR</span>
                  <input type="checkbox" className="toggle border-base-content-100 text-base-content-100 bg-base-content-100" checked={inScanMode} onChange={() => setInScanMode(cur => !cur)} />
                  <span className="label-text text-sm text-base-content">Scan QR</span>
                </label>
              </div>

            </section>

            <section className="grid grid-cols-1 p-4 w-full relative min-h-[100vw]">
              <article
                className={cn(
                  "place-self-center flex items-center flex-col transition-all duration-300 ease-in-out w-full",
                  inScanMode ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
                )}
              >
                {data?.sd?.sdp &&
                  <>
                    <Responsive
                      xs={
                        <QRCode
                          value={JSON.stringify(data.sd)}
                          size={300}
                          className="aspect-square bg-white p-2 rounded-lg"
                        />
                      }
                      sm={
                        <QRCode
                          value={JSON.stringify(data.sd)}
                          size={400}
                          className="aspect-square bg-white p-2 rounded-lg"
                        />
                      }
                    />
                    <span>Type: {data?.sd?.type}</span>
                  </>
                }
              </article>

              <article className={cn(
                "absolute top-4 flex flex-col items-center w-full transition-all duration-300 ease-in-out",
                inScanMode ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"
              )}>
                <figure className="w-full sm:w-[400px]">
                  <Scanner
                    onScan={onScan} // on scan, generate answer
                    classNames={{
                      video: "", container: "border border-neutral-content/30 rounded-lg overflow-hidden"
                    }}
                  /></figure>
              </article>
            </section>
          </>
        }

        {data.role !== "follower" &&
          <section tabIndex={0} className="collapse collapse-arrow bg-base-100 border-base-300 border rounded-lg">
            <header className="collapse-title font-semibold">Settings</header>
            <main className="collapse-content text-sm grid grid-cols-1 gap-4">

              <Slider min={1} max={25} step={1} suffix="s" value={flashData.minIntervalSecs} label="Min interval in secs" onChange={(e) => {
                const secs = parseInt(e.target.value)
                if (secs > flashData.maxIntervalSecs) return;
                setFlashData(cur => ({ ...cur, minIntervalSecs: secs }))
              }}>
              </Slider>

              <Slider min={1} max={25} step={1} suffix="s" value={flashData.maxIntervalSecs} label="Max interval in secs" onChange={(e) => {
                const secs = parseInt(e.target.value)
                if (secs < flashData.minIntervalSecs) return;
                setFlashData(cur => ({ ...cur, maxIntervalSecs: secs }))
              }}>
              </Slider>

              <label className="-mb-4">Icon</label>
              <ul className="menu menu-horizontal bg-base-200 rounded-box gap-1">
                <li>
                  <a className={cn(flashData.iconName === "player" && "menu-active")} onClick={() => setFlashData(cur => ({ ...cur, iconName: "player" }))}>
                    <PersonStanding />
                  </a>
                </li>
                <li>
                  <a className={cn(flashData.iconName === "ball" && "menu-active")} onClick={() => setFlashData(cur => ({ ...cur, iconName: "ball" }))}>
                    <img src={footballSvg} alt="football" className="h-[24px] w-[24px]" />
                  </a>
                </li>
              </ul>
            </main>
          </section>
        }

        <button className="btn btn-accent btn-lg rounded-lg" disabled={!data.connected || data.role !== "leader"}
          onClick={flashData.isFlashPlaying ? stopFlashing : startFlashing}>

          {flashData.isFlashPlaying
            ? <><Pause />Pause</>
            : <><Play />Start</>
          }
          {data.role === "follower" && " on other device"}
        </button>

        {/* <section className="flex items-center flex-col">
        <button className="relative btn btn-circle w-36 h-36 btn-success">
          <PlayIcon className="w-4/6" />
        </button>
      </section> */}


        {/* {data?.offer && JSON.stringify(data.offer)} */}
      </section >
    </>
  )
}
