import {
    collection,
    query,
    orderBy as fbOrderBy,
    where,
    limit,
    startAfter,
    getDocs,
    QueryConstraint,
    QueryDocumentSnapshot,
    type DocumentData,
    getFirestore,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import type { Debt } from "../../domain/business/entities/Debt";
import { documentToDebt } from "./mapDocumentToDebt";

type OrderBy = {
    field: string;
    direction: "asc" | "desc";
};

type Filter = {
    field: string;
    op: any;
    value: any;
};

type Props = {
    path: string;
    pageSize?: number;
    orderBy: OrderBy[];
    filters?: Filter[];
};

export function useFirestorePagination({
    path,
    pageSize = 10,
    orderBy,
    filters = [],
}: Props) {

    const [data, setData] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const idsRef = useRef<Set<string>>(new Set());
    const colRef = collection(getFirestore(), path);

    const buildQuery = () => {
        const constraints: QueryConstraint[] = [];

        filters.forEach((f) => {
            constraints.push(where(f.field, f.op, f.value));
        });

        orderBy.forEach((o) => {
            constraints.push(fbOrderBy(o.field, o.direction));
        });

        if (lastDocRef.current) {
            constraints.push(startAfter(lastDocRef.current));
        }

        constraints.push(limit(pageSize));


        return query(colRef, ...constraints);
    };

    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);

        try {
            const q = buildQuery();
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
                return;
            }

            const newItems: Debt[] = [];

            snapshot.docs.forEach((doc) => {
                const item = documentToDebt(doc.data(), doc.id);

                // evitar duplicados
                if (!idsRef.current.has(item.id)) {
                    idsRef.current.add(item.id);
                    newItems.push(item);
                }
            });

            lastDocRef.current =
                snapshot.docs[snapshot.docs.length - 1];

            setData((prev) => [...prev, ...newItems]);

            if (snapshot.size < pageSize) {
                setHasMore(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setData([]);
        setHasMore(true);
        lastDocRef.current = null;
        idsRef.current.clear();
    };

    useEffect(() => {
        reset();
        loadMore();
    }, [JSON.stringify(filters)]);

    return {
        data,
        loading,
        hasMore,
        loadMore,
        reset,
    };
}
