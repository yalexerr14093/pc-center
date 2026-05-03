import clsx from "clsx";
import { Fragment } from "react";
import { ORDER_FLOW, flowIndex, getOrderStatusMeta, isCancelled } from "../lib/orderStatus";

export function OrderStatusStepper({ status, className }: { status: string; className?: string }) {
  const cancelled = isCancelled(status);
  const currentIdx = cancelled ? -1 : flowIndex(status);

  return (
    <div className={clsx("w-full", className)}>
      {cancelled ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900">
          Заказ отменён — цепочка этапов остановлена, товар возвращён в остатки.
        </div>
      ) : null}

      <div className="flex w-full min-w-0 items-center gap-0 overflow-x-auto pb-1 pt-1 [scrollbar-width:thin]">
        {ORDER_FLOW.map((step, i) => {
          const meta = getOrderStatusMeta(step);
          const done = !cancelled && currentIdx > i;
          const active = !cancelled && currentIdx === i;
          const segmentComplete = !cancelled && currentIdx > i;

          return (
            <Fragment key={step}>
              <div className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5 text-center sm:w-[6.25rem]">
                <div
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-2 ring-offset-2 ring-offset-white transition",
                    done && "bg-emerald-500 text-white ring-emerald-100",
                    active && "bg-violet-600 text-white ring-violet-200 shadow-md shadow-violet-500/20",
                    !done && !active && !cancelled && "bg-white text-slate-400 ring-slate-200",
                    cancelled && "bg-slate-200 text-slate-500 ring-slate-100"
                  )}
                  title={meta.hint}
                >
                  {done ? "✓" : i + 1}
                </div>
                <div>
                  <div
                    className={clsx(
                      "text-[11px] font-semibold leading-tight sm:text-xs",
                      active ? "text-violet-950" : done ? "text-slate-800" : "text-slate-500"
                    )}
                  >
                    {meta.label}
                  </div>
                  <div className="mt-0.5 hidden text-[10px] leading-snug text-slate-500 sm:block">{meta.hint}</div>
                </div>
              </div>
              {i < ORDER_FLOW.length - 1 ? (
                <div
                  className={clsx(
                    "mb-6 h-1 min-w-[0.5rem] flex-1 rounded-full self-center sm:mb-7",
                    segmentComplete ? "bg-emerald-400" : "bg-slate-200"
                  )}
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
