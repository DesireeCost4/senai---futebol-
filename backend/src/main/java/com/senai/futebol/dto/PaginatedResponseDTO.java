package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class PaginatedResponseDTO<T> {

    @JsonProperty("data")
    private List<T> data;

    @JsonProperty("meta")
    private MetaDTO meta;

    public PaginatedResponseDTO() {}

    public PaginatedResponseDTO(List<T> data, MetaDTO meta) {
        this.data = data;
        this.meta = meta;
    }

    public List<T> getData() { return data; }
    public void setData(List<T> data) { this.data = data; }

    public MetaDTO getMeta() { return meta; }
    public void setMeta(MetaDTO meta) { this.meta = meta; }

    public static class MetaDTO {
        @JsonProperty("page")
        private Integer page;

        @JsonProperty("limit")
        private Integer limit;

        @JsonProperty("total_items")
        private Long totalItems;

        @JsonProperty("total_pages")
        private Integer totalPages;

        public MetaDTO() {}

        public MetaDTO(Integer page, Integer limit, Long totalItems, Integer totalPages) {
            this.page = page;
            this.limit = limit;
            this.totalItems = totalItems;
            this.totalPages = totalPages;
        }

        public Integer getPage() { return page; }
        public void setPage(Integer page) { this.page = page; }

        public Integer getLimit() { return limit; }
        public void setLimit(Integer limit) { this.limit = limit; }

        public Long getTotalItems() { return totalItems; }
        public void setTotalItems(Long totalItems) { this.totalItems = totalItems; }

        public Integer getTotalPages() { return totalPages; }
        public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }
    }
}
