import footballSvg from "@/assets/football.svg";
import { Slider } from '@/components/slider';
import { cn } from '@/lib/utils';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, ChevronLeft, Pause, PersonStanding, Play, type LucideProps } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlashData } from "./pair"

export const Route = createFileRoute('/football-trainer/trainer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Trainer />
}

function randomChoice() {
  return Math.random() < 0.5;
}

const icons = {
  ball: (props: LucideProps) => <img src={footballSvg} alt="football" className={props.className} />,
  player: (props: LucideProps) => <PersonStanding {...props} />,
}

type FlashDataIndividual = FlashData & {
  direction: "left" | "right" | "up" | "down",
  speech: boolean
}

function Trainer() {
  const [flashData, setFlashData] = useState<FlashDataIndividual>({
    flashComponent: null,
    isFlashPlaying: false,
    timeoutCleanupId: 0,
    iconName: "ball",
    minIntervalSecs: 3,
    maxIntervalSecs: 3,
    timeoutSecs: 1,
    direction: "left",
    speech: false
  });

  const flashDataRef = useRef(flashData);
  const [flashOn, setFlashOn] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis>(null);
  const leftUtterance = new SpeechSynthesisUtterance("left");
  const rightUtterance = new SpeechSynthesisUtterance("right");

  useEffect(() => {
    if ("speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis;
    }

    return () => {
      cleanup()
    }
  }, [])

  function cleanup() {
    console.log("Unmounting PairTrainer")
    clearInterval(flashData.timeoutCleanupId)
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
  }

  const flash = useCallback((timeout: number = flashData.timeoutSecs) => {
    setFlashOn(true) // flash red
    const direction = randomChoice() ? "left" : "right"
    setFlashData(cur => ({ ...cur, direction }))

    if (flashDataRef.current.speech)
      speechSynthRef?.current?.speak(direction === "left" ? leftUtterance : rightUtterance)

    setTimeout(() => {
      setFlashOn(false)
    }, timeout * 1000) // keep flash for 2.5s
  }, [flashData.timeoutSecs]);

  useEffect(() => {
    flashDataRef.current = flashData;
  }, [flashData])

  function startFlashing() {
    const updated = { ...flashData, isFlashPlaying: true }
    setFlashData(updated)

    flashDataRef.current.isFlashPlaying = true;

    function createTimeout() {
      if (!flashDataRef.current.isFlashPlaying) return;
      flash()
      const interval = (flashData.minIntervalSecs + Math.random() *
        (flashData.maxIntervalSecs - flashData.minIntervalSecs)) * 1000;

      setTimeout(createTimeout, interval)
    }
    createTimeout();
  }

  function stopFlashing() {
    setFlashData(cur => ({ ...cur, isFlashPlaying: false }))
    // clear Interval
    clearInterval(flashData.timeoutCleanupId)
  }

  return (
    <>
      <Link to="/football-trainer" className="p-1 btn btn-ghost">
        <ChevronLeft/>
        Home
      </Link>
      <section className="relative grid grid-cols-1 gap-4">
        {/* name of each tab group should be unique */}

        {
          (flashData.isFlashPlaying ? <>
            {/* Webkit for iPhone compatability */}
            <section className="grid place-items-center">
              <div className={cn("w-8/12 aspect-3/5 place-self-center transition-all [-webkit-transform:translateZ(0)]", {
                "opacity-100 scale-100": flashOn,
                "opacity-0 scale-50": !flashOn
              })}>
                {/*  This is the icon */}
                {icons[flashData.iconName]({ className: "w-full h-full drop-shadow-[0px_0px_32px_green]" })}
              </div>
              <figure className="grid place-items-center min-h-40 relative mb-2">
                <ArrowLeft className={cn("absolute w-36 h-36 transition-all opacity-0", flashData.direction === "left" && flashOn && "opacity-100")} />
                <ArrowRight className={cn("absolute w-36 h-36 transition-all opacity-0", flashData.direction === "right" && flashOn && "opacity-100")} />
              </figure>
            </section>
          </> : <p className="w-8/12 aspect-3/5 place-self-center grid place-items-center text-center text-md text-base-content/70">Click start</p>)
        }

        <section tabIndex={0} className="collapse collapse-arrow bg-base-100 border-base-300 border rounded-lg">
          {/* For control */}
          <input type="checkbox" />
          <header className="collapse-title font-semibold">Settings</header>
          <main className="collapse-content text-sm grid grid-cols-1 gap-4">

            <Slider min={1} max={5} step={1} suffix="s" value={flashData.minIntervalSecs} label="Min interval in secs" onChange={(e) => {
              const secs = parseInt(e.target.value)
              if (secs > flashData.maxIntervalSecs) return;
              setFlashData(cur => ({ ...cur, minIntervalSecs: secs }))
            }}>
            </Slider>

            <Slider min={1} max={5} step={1} suffix="s" value={flashData.maxIntervalSecs} label="Max interval in secs" onChange={(e) => {
              const secs = parseInt(e.target.value)
              if (secs < flashData.minIntervalSecs) return;
              setFlashData(cur => ({ ...cur, maxIntervalSecs: secs }))
            }}>
            </Slider>

            <section className="grid grid-cols-2">
              <article>
                <label className="block">Icon</label>
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
              </article>
              <article className="flex flex-col gap-2">
                <label className="block">Speak</label>
                <input type="checkbox" className="toggle toggle-lg" checked={flashData.speech}
                  onChange={e => {
                    setFlashData(cur => ({ ...cur, speech: e.target.checked }))
                    console.log(flashData)
                  }} />
              </article>
            </section>
          </main>
        </section>

        <button className="btn btn-accent btn-lg rounded-lg"
          onClick={flashData.isFlashPlaying ? stopFlashing : startFlashing}>

          {flashData.isFlashPlaying
            ? <><Pause />Pause</>
            : <><Play />Start</>
          }
        </button>
      </section >
    </>
  )
}
