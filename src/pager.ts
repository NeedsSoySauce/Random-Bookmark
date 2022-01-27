export interface PagedResult<T> {
    items: T[];
    total: number;
    pageSize: number;
    pageCount: number;
    pageNumber: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export class ArrayPager<T> {
    private items: T[];
    private pageSize: number;
    private pageCount: number;

    public constructor(items: T[], pageSize = 10) {
        this.items = items;
        this.pageSize = pageSize;
        this.pageCount = Math.ceil(items.length / pageSize);
    }

    public getPage(pageNumber: number): PagedResult<T> {
        if (pageNumber > this.pageCount) throw Error('Out of range');
        const offset = pageNumber * this.pageSize;
        return {
            items: this.items.slice(offset, offset + this.pageSize),
            total: this.items.length,
            pageSize: this.pageSize,
            pageCount: this.pageCount,
            pageNumber,
            hasNext: pageNumber < this.pageCount - 1,
            hasPrevious: pageNumber > 0
        };
    }
}
