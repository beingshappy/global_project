# risk_detector.py

def analyze_risk(women_count, men_count, current_hour):
    """
    Analyzes the scene to determine risk level based on configured logic.
    Returns: (risk_level, risk_type, confidence_score)
    """
    
    # Case 1: Woman Surrounded by Men
    if women_count >= 1 and men_count >= 3:
        return ('HIGH', 'SURROUNDED_BY_MEN', 0.95)
        
    # Case 2: Lone Woman at Night (Assuming 8 PM (20) to 5 AM (5))
    is_night = current_hour >= 20 or current_hour <= 5
    if women_count == 1 and men_count == 0 and is_night:
        return ('MEDIUM', 'LONE_WOMAN_NIGHT', 0.85)

    return ('LOW', 'SAFE', 1.0)
