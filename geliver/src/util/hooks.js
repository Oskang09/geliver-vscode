import { useEffect, useMemo, useState } from "react";

export const PaginateEmptyPromise = Promise.resolve([[], undefined]);
export function usePagination(querier) {
    const [trigger, setTrigger] = useState(false);

    const [loading, setLoading] = useState(false);
    const [end, setEnd] = useState(false);
    const [cursor, setCursor] = useState();
    const [result, setResult] = useState([]);

    useEffect(() => {
        if (!end && !loading) {
            setLoading(true);

            (async function () {
                const [data, nextCursor] = await querier(cursor);
                if (cursor) {
                    setResult([...result, ...data]);
                } else {
                    setResult([...data]);
                }

                setCursor(nextCursor);
                if (!nextCursor) {
                    setEnd(true);
                }
                setLoading(false);
            })()
        }
    }, [trigger]);

    const controller = {
        loading: loading,
        isEnd: end,
        refresh: () => {
            if (loading) return;
            setCursor(undefined);
            setEnd(false);

            setTrigger(!trigger);
        },
        loadMore: () => {
            if (end || loading) return;
            setTrigger(!trigger);
        },
    }

    return [controller, result];
}