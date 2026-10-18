package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class JogadorResponseDTO {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("position")
    private String position;

    @JsonProperty("agility")
    private Integer agility;

    @JsonProperty("age")
    private Integer age;

    @JsonProperty("condition")
    private String condition;

    @JsonProperty("base_value")
    private BigDecimal baseValue;

    @JsonProperty("market_value")
    private BigDecimal marketValue;

    @JsonProperty("pace")
    private Integer pace;

    @JsonProperty("shooting")
    private Integer shooting;

    @JsonProperty("passing")
    private Integer passing;

    @JsonProperty("dribbling")
    private Integer dribbling;

    @JsonProperty("defending")
    private Integer defending;

    @JsonProperty("physical")
    private Integer physical;

    @JsonProperty("potential")
    private Integer potential;

    @JsonProperty("overall")
    private Integer overall;

    @JsonProperty("club_id")
    private Integer clubId;

    public JogadorResponseDTO() {
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public Integer getAgility() { return agility; }
    public void setAgility(Integer agility) { this.agility = agility; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public BigDecimal getBaseValue() { return baseValue; }
    public void setBaseValue(BigDecimal baseValue) { this.baseValue = baseValue; }

    public BigDecimal getMarketValue() { return marketValue; }
    public void setMarketValue(BigDecimal marketValue) { this.marketValue = marketValue; }

    public Integer getPace() { return pace; }
    public void setPace(Integer pace) { this.pace = pace; }

    public Integer getShooting() { return shooting; }
    public void setShooting(Integer shooting) { this.shooting = shooting; }

    public Integer getPassing() { return passing; }
    public void setPassing(Integer passing) { this.passing = passing; }

    public Integer getDribbling() { return dribbling; }
    public void setDribbling(Integer dribbling) { this.dribbling = dribbling; }

    public Integer getDefending() { return defending; }
    public void setDefending(Integer defending) { this.defending = defending; }

    public Integer getPhysical() { return physical; }
    public void setPhysical(Integer physical) { this.physical = physical; }

    public Integer getPotential() { return potential; }
    public void setPotential(Integer potential) { this.potential = potential; }

    public Integer getOverall() { return overall; }
    public void setOverall(Integer overall) { this.overall = overall; }

    public Integer getClubId() { return clubId; }
    public void setClubId(Integer clubId) { this.clubId = clubId; }
}
