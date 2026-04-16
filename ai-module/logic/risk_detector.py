def analyze_risk(women_count, men_count, current_hour):
    """
    Analyzes the scene to determine risk level.
    Returns: (risk_level, risk_type, confidence_score)
    """
    total = women_count + men_count

    # ── HIGHEST PRIORITY: SOS always overrides (called externally) ────────────

    # ── Case 1: Woman SEVERELY outnumbered (3+ men) ───────────────────────────
    if women_count >= 1 and men_count >= 3:
        # More men = higher confidence
        conf = min(0.95 + (men_count - 3) * 0.01, 0.99)
        return ('HIGH', 'SURROUNDED_BY_MEN', round(conf, 2))

    # ── Case 2: Woman outnumbered (2 men), any time ──────────────────────────
    if women_count >= 1 and men_count >= 2:
        return ('MEDIUM', 'OUTNUMBERED_BY_MEN', 0.80)

    # ── Case 3: Lone woman at night ───────────────────────────────────────────
    is_night = current_hour >= 20 or current_hour <= 5
    if women_count >= 1 and men_count == 0 and is_night:
        return ('MEDIUM', 'LONE_WOMAN_NIGHT', 0.85)

    # ── Case 4: Lone woman with ANY man at night ──────────────────────────────
    if women_count >= 1 and men_count >= 1 and is_night:
        return ('MEDIUM', 'WOMAN_WITH_MAN_NIGHT', 0.75)

    # ── Case 5: Large crowd with woman present ────────────────────────────────
    if women_count >= 1 and total >= 6:
        return ('MEDIUM', 'LARGE_CROWD_WOMAN_PRESENT', 0.70)

    return ('LOW', 'SAFE', 1.0)
