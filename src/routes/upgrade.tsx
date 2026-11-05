import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, useDraggable, useDroppable, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { BookOpen, ChevronRight, Gem, LockKeyhole, Plus } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/game/Shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ART } from "@/lib/art";
import { fmt, soloRate, useGame, beep, haptic } from "@/lib/game";
import { CHARACTER_COST, CHARACTERS, MAX_MERGE_LEVEL, moveCharacter } from "@/lib/merge";
import { MERGE_ART } from "@/lib/merge-art";

export const Route = createFileRoute("/upgrade")({
  head: () => ({ meta: [
    { title: "Merge Island — Solo Slots" },
    { name: "description", content: "Grow your island, merge evolving creatures and collect SOLO." },
    { property: "og:title", content: "Merge Island — Solo Slots" },
    { property: "og:description", content: "Merge golden buddies, discover new evolutions and collect SOLO." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Upgrade,
});

function Creature({ level, silhouette = false }: { level: number; silhouette?: boolean }) {
  return <img src={MERGE_ART[level - 1]} width={128} height={128} draggable={false} alt={silhouette ? "Undiscovered creature" : CHARACTERS[level - 1]?.name} className={`merge-creature merge-motion-${level} ${silhouette ? "merge-silhouette" : ""}`} />;
}

function Cell({ index, level, selected, match, onSelect, fresh }: { index: number; level: number | null; selected: boolean; match: boolean; onSelect: () => void; fresh: boolean }) {
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: index });
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({ id: index, disabled: !level });
  return <div ref={dropRef} className={`merge-cell ${isOver || selected ? "merge-cell-active" : ""} ${match ? "merge-cell-match" : ""}`}>
    <Button ref={dragRef} variant="ghost" {...attributes} {...listeners} onClick={onSelect} aria-label={level ? `Slot ${index + 1}, ${CHARACTERS[level - 1]?.name}, level ${level}` : `Empty slot ${index + 1}`} className={`merge-cell-button ${isDragging ? "opacity-20" : ""} ${fresh ? "merge-evolve" : ""}`}>
      {level ? <><Creature level={level} /><span className="merge-level">{level}</span></> : <span className="merge-empty" />}
    </Button>
  </div>;
}

function Upgrade() {
  const { s, ready, buyMerge, moveMerge, pendingSolo, claimSolo } = useGame();
  const [active, setActive] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const [collection, setCollection] = useState(false);
  const dragged = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const best = s.mergeBest;
  const next = Math.min(MAX_MERGE_LEVEL, best + 1);
  const nextCreature = CHARACTERS[next - 1];
  const full = !s.mergeBoard.includes(null);
  function move(from: number, to: number) {
    const result = moveCharacter(s.mergeBoard, from, to);
    if (!result) { toast("These creatures cannot merge"); setSelected(null); return; }
    moveMerge(from, to); setSelected(null);
    if (result.merged) {
      setFresh(to); beep(s.sound, 900, 0.18); haptic();
      if (result.level > best) toast.success(`${CHARACTERS[result.level - 1]?.name} discovered`);
    }
  }
  function end(event: DragEndEvent) {
    setActive(null);
    if (event.over) move(Number(event.active.id), Number(event.over.id));
    setTimeout(() => { dragged.current = false; }, 0);
  }
  function select(index: number) {
    if (dragged.current) return;
    if (selected !== null && selected !== index) move(selected, index);
    else setSelected(s.mergeBoard[index] ? (selected === index ? null : index) : null);
  }
  return <Screen bare scroll={false}>
    <div className="merge-page">
      <header className="merge-heading">
        <div className="merge-title"><span className="merge-production"><Gem size={13} />{fmt(soloRate(s))}<small> SOLO / hr</small></span></div>
        <Button variant="ghost" size="icon" className="merge-book" onClick={() => setCollection(true)} aria-label="Creature collection" title="Creature collection"><BookOpen /></Button>
      </header>
      <section className="merge-world" aria-label="Merge island board">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => { dragged.current = true; setActive(Number(e.active.id)); setSelected(null); }} onDragEnd={end} onDragCancel={() => { setActive(null); dragged.current = false; }}>
          <div className="merge-grid">
            {s.mergeBoard.map((level, index) => <Cell key={index} index={index} level={level} selected={selected === index} match={(active !== null || selected !== null) && level !== null && level < 6 && level === s.mergeBoard[active ?? selected ?? -1] && index !== (active ?? selected)} onSelect={() => select(index)} fresh={fresh === index} />)}
          </div>
          {active !== null && ready ? createPortal(<DragOverlay>{s.mergeBoard[active] ? <div className="merge-drag"><Creature level={s.mergeBoard[active] ?? 1} /></div> : null}</DragOverlay>, document.body) : null}
        </DndContext>
      </section>
      <Button variant="ghost" className="merge-next" onClick={() => setCollection(true)}>
        <div className="merge-preview"><Creature level={next} silhouette={best < 6} />{best < 6 && <LockKeyhole size={12} />}</div>
        <div><span>{best === 6 ? "COMPLETE" : "NEXT"}</span><strong>{nextCreature?.name}</strong></div>
        <span className="merge-next-level">Lv. {next}<ChevronRight size={15} /></span>
      </Button>
      <div className="merge-actions">
        <Button disabled={!ready || full || s.coins < CHARACTER_COST} className="merge-buy" onClick={() => { setFresh(s.mergeBoard.indexOf(null)); buyMerge(); beep(s.sound, 550); }} aria-label="Buy Buddy for 500 coins"><Plus size={19} /><strong>{full ? "Full" : "Buy"}</strong><span><img src={ART.coin} alt="Coins" width={18} height={18} />{CHARACTER_COST}</span></Button>
        <Button disabled={!ready || pendingSolo < 1} className="merge-claim" onClick={() => { const amount = claimSolo(); toast.success(`+${fmt(amount)} SOLO collected`); }} aria-label="Collect SOLO"><Gem size={18} /><div><strong>{fmt(pendingSolo)} SOLO</strong><span>Collect</span></div></Button>
      </div>
    </div>
    <Dialog open={collection} onOpenChange={setCollection}><DialogContent className="merge-collection" aria-describedby={undefined}>
      <DialogTitle className="font-display text-xl">Creature collection</DialogTitle>
      <div className="merge-collection-grid">{CHARACTERS.map((creature, i) => <div key={creature.name} className="merge-collection-item"><Creature level={i + 1} silhouette={i + 1 > best} /><strong>{i + 1 <= best ? creature.name : "Undiscovered"}</strong><span>Lv. {i + 1} · {creature.family}</span><small>{i + 1 <= best ? `${fmt(creature.rate)} SOLO / hr` : <LockKeyhole size={12} />}</small></div>)}</div>
    </DialogContent></Dialog>
  </Screen>;
}