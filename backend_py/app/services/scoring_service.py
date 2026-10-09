from typing import Dict, Any

class ScoringService:
    @staticmethod
    def calculate_severity_score(
        disaster_type: str,
        people_affected: int,
        injuries: int = 0,
        trapped: int = 0,
        missing: int = 0,
        infrastructure_damage: str = "MODERATE",
        medical_urgency: bool = False
    ) -> Dict[str, Any]:
        """
        Explainable Rule-Based Disaster Severity & Priority Scoring
        Combines weighted metrics into a 0-100 score:
        - Disaster Type Hazard Weight (0 - 25)
        - Human Impact & Casualties (0 - 35)
        - Trapped & Missing Criticality (0 - 25)
        - Infrastructure & Medical Urgency (0 - 15)
        """
        type_weights = {
            "FLOOD": 22,
            "FIRE": 25,
            "EARTHQUAKE": 25,
            "BUILDING COLLAPSE": 24,
            "CYCLONE": 20,
            "LANDSLIDE": 21,
            "INDUSTRIAL ACCIDENT": 23,
            "OTHER": 15
        }
        base_type_score = type_weights.get(disaster_type.upper(), 15)

        # Human impact scoring (0-35)
        victim_score = min(35, (people_affected * 0.1) + (injuries * 2.5))

        # Life hazard (trapped + missing) (0-25)
        hazard_score = min(25, (trapped * 4.0) + (missing * 3.0))

        # Infrastructure damage (0-15)
        damage_weights = {
            "CRITICAL": 10,
            "SEVERE": 8,
            "MODERATE": 5,
            "LOW": 2
        }
        infra_score = damage_weights.get(infrastructure_damage.upper(), 5)
        if medical_urgency:
            infra_score += 5

        total_score = round(base_type_score + victim_score + hazard_score + infra_score, 1)
        total_score = min(100.0, total_score)

        if total_score >= 75.0 or trapped >= 5 or injuries >= 20:
            recommended_priority = "P1" # Critical
            tier_name = "P1 — Critical Emergency"
        elif total_score >= 50.0:
            recommended_priority = "P2" # High
            tier_name = "P2 — High Urgency"
        elif total_score >= 28.0:
            recommended_priority = "P3" # Moderate
            tier_name = "P3 — Moderate Response"
        else:
            recommended_priority = "P4" # Low
            tier_name = "P4 — Low Priority / Advisory"

        return {
            "score": total_score,
            "recommended_priority": recommended_priority,
            "tier_name": tier_name,
            "breakdown": {
                "disaster_hazard_factor": base_type_score,
                "casualty_impact_factor": round(victim_score, 1),
                "trapped_missing_factor": round(hazard_score, 1),
                "infrastructure_medical_factor": infra_score
            },
            "explanation": f"Score {total_score}/100 derived from {disaster_type} hazard profile, {people_affected} affected, {injuries} injuries, {trapped} trapped."
        }
