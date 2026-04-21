import { useEffect, useRef } from "react";
import { Box, CircularProgress } from "@mui/material";
import DebtTable, { DebtTableAccountant } from "./DebtTable";

export function DebtList({
    debts,
    loadMore,
    hasMore,
    loading,
    onClick
}: any) {
    const loaderRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loading) {
                    loadMore();
                }
            },
            { threshold: 1 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadMore, loading]);

    return (
        <Box>

            <DebtTable debts={debts} onClick={onClick} />


            {/* Invisible target for the observer */}
            <Box ref={loaderRef} sx={{ height: 20, mt: 2 }} />

            {loading && (
                <Box display="flex" justifyContent="center" mt={3} mb={3}>
                    <CircularProgress color="primary" />
                </Box>
            )}
        </Box>
    );
}

export function DebtListAccountant({
    debts,
    loadMore,
    hasMore,
    loading,
    onClick
}: any) {
    const loaderRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loading) {
                    loadMore();
                }
            },
            { threshold: 1 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadMore, loading]);

    return (
        <Box>

            <DebtTableAccountant debts={debts} onClick={onClick} />


            {/* Invisible target for the observer */}
            <Box ref={loaderRef} sx={{ height: 20, mt: 2 }} />

            {loading && (
                <Box display="flex" justifyContent="center" mt={3} mb={3}>
                    <CircularProgress color="primary" />
                </Box>
            )}
        </Box>
    );
}