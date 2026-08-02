import { Alert02Icon, ArrowUpRight01Icon, Icon } from "@/components/icons/Icon";
import { SCANNING_PAST_IRONWOOD_WORKS } from "@/lib/constants";

export function PostIronwoodNotice() {
  if (SCANNING_PAST_IRONWOOD_WORKS) return null;

  return (
    <div className="mb-8 flex items-start gap-3 rounded-2xl border border-partial/30 bg-partial/[0.06] p-6 text-sm leading-relaxed text-partial">
      <Icon icon={Alert02Icon} size={18} />
      <div>
        <p className="mb-2">
          Scans are temporarily unavailable. Ironwood activated at block 3,428,143 on 28 July, and
          the zingolib engine Turnstile scans with cannot read post-activation blocks yet —
          upstream merged Ironwood support on 24 July and we are integrating it. Your funds are
          unaffected; this only pauses the balance check.
        </p>
        <a
          href="https://github.com/zingolabs/zingolib/issues/2420"
          target="_blank"
          rel="noreferrer"
          className="inline-flex cursor-pointer items-center gap-1.5 text-partial underline underline-offset-4 transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Track the upstream work
          <Icon icon={ArrowUpRight01Icon} size={14} />
        </a>
      </div>
    </div>
  );
}
