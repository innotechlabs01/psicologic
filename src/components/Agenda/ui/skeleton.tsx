import React from "react";
import { cn } from "../../../lib/utils";

type Props = React.ComponentProps<"div">;

function Skeleton({ className, ...props }: Props) {
    return (
        <div
            data-slot="skeleton"
            aria-hidden
            className={cn("animate-pulse", className)}
            {...props}
        />
    );
}

function SkeletonLine({ className, ...props }: Props) {
    return <Skeleton className={cn("h-4 bg-gray-200 dark:bg-gray-700 rounded", className)} {...props} />;
}

function SkeletonCircle({ className, ...props }: Props) {
    return <Skeleton className={cn("w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full", className)} {...props} />;
}

function SkeletonCard({ className, ...props }: Props) {
    return (
        <Skeleton
            className={cn("p-3 bg-gray-100 dark:bg-gray-800 rounded-md space-y-2", className)}
            {...props}
        />
    );
}

function SkeletonGrid({ cols = 3, rows = 2, className, ...props }: Props & { cols?: number; rows?: number }) {
    const items = Array.from({ length: cols * rows });
    const style = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } as React.CSSProperties;
    return (
        <div className={cn("grid gap-4", className)} style={style} {...props}>
            {items.map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export { Skeleton, SkeletonLine, SkeletonCircle, SkeletonCard, SkeletonGrid };
