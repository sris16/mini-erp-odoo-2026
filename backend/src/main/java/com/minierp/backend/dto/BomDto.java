package com.minierp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomDto {
    private Long id;
    private String finishedProductName;
    private Long finishedProductId;
    private List<ComponentDto> components;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComponentDto {
        private String name;
        private Integer qty;
    }
}
