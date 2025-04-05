import { Link } from "@tanstack/react-router";
import { ChevronLeft, Info } from "lucide-react";

export interface NavProps {
  backLink: string;
  backText: string;
  infoTitle: string;
  infoContent: React.ReactNode
}

export function Nav({ backLink, backText = "Home", infoTitle = "Info", infoContent }: NavProps) {
  return <section className="flex justify-between items-center mb-3">
    <Link to={backLink} className="p-0 btn btn-ghost">
      <ChevronLeft className="p-0" />
      {backText}
    </Link>
    <button className="p-0 btn btn-ghost justify-end" onClick={() => (document?.getElementById('my_modal_2') as HTMLDialogElement).showModal()}>
      <Info className="p-0 text-base-content/30"></Info>
    </button>
    <dialog id="my_modal_2" className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{infoTitle}</h3>
        {infoContent}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </section>
}
