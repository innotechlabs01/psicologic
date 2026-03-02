import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    );
};

export const SkeletonLine: React.FC<{ className?: string }> = ({ className }) => (
    <Skeleton className={cn("h-4", className)} />
);

export const SkeletonCircle: React.FC<{ className?: string }> = ({ className }) => (
    <Skeleton className={cn("rounded-full h-10 w-10", className)} />
);

export const CardSkeleton: React.FC = () => (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
    </div>
);

// Alias for CardSkeleton (used in some components)
export const SkeletonCard = CardSkeleton;

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="overflow-hidden bg-card rounded-xl shadow-md border border-border">
        <table className="w-full text-left border-collapse">
            <thead className="bg-muted border-b border-border">
                <tr>
                    {Array(5).fill(0).map((_, i) => (
                        <th key={i} className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {Array(rows).fill(0).map((_, i) => (
                    <tr key={i}>
                        {Array(5).fill(0).map((_, j) => (
                            <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
