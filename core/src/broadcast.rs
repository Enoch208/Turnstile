use std::collections::HashSet;

use crate::chain::{IRONWOOD_ACTIVATION_HEIGHT, TARGET_BLOCK_SECONDS};

pub const FIRE_WINDOW_BLOCKS: u64 = 60;

const BLOCKS_48H: u64 = 48 * 3600 / TARGET_BLOCK_SECONDS;
const BLOCKS_1H: u64 = 3600 / TARGET_BLOCK_SECONDS;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AlertStage {
    FortyEightHours,
    OneHour,
    Activation,
}

impl AlertStage {
    pub const ALL: [AlertStage; 3] = [Self::FortyEightHours, Self::OneHour, Self::Activation];

    pub fn trigger_height(self) -> u64 {
        match self {
            Self::FortyEightHours => IRONWOOD_ACTIVATION_HEIGHT - BLOCKS_48H,
            Self::OneHour => IRONWOOD_ACTIVATION_HEIGHT - BLOCKS_1H,
            Self::Activation => IRONWOOD_ACTIVATION_HEIGHT,
        }
    }

    pub fn window(self) -> std::ops::Range<u64> {
        let start = self.trigger_height();
        let next_trigger = match self {
            Self::FortyEightHours => Self::OneHour.trigger_height(),
            Self::OneHour => Self::Activation.trigger_height(),
            Self::Activation => u64::MAX,
        };
        start..(start + FIRE_WINDOW_BLOCKS).min(next_trigger)
    }

    pub fn title(self) -> &'static str {
        match self {
            Self::FortyEightHours => "Turnstile — 48 hours to Ironwood",
            Self::OneHour => "Turnstile — 1 hour to Ironwood",
            Self::Activation => "Turnstile — Ironwood is active",
        }
    }

    pub fn body(self, site_url: &str) -> String {
        let site = site_url.trim_end_matches('/');
        match self {
            Self::FortyEightHours => format!(
                "Ironwood activates at block {IRONWOOD_ACTIVATION_HEIGHT}, about 48 hours from \
                 now. Balances change — re-check your wallet at {site}/check. It takes a minute \
                 and needs only a viewing key."
            ),
            Self::OneHour => format!(
                "About one hour of Orchard deposits left. Ironwood activates at block \
                 {IRONWOOD_ACTIVATION_HEIGHT}. If your last check showed Orchard funds, move \
                 them now: {site}/guides"
            ),
            Self::Activation => format!(
                "Block {IRONWOOD_ACTIVATION_HEIGHT} reached — the Orchard pool no longer takes \
                 deposits. Funds already in Orchard are not lost, and migration still works: \
                 {site}/guides"
            ),
        }
    }
}

#[derive(Default)]
pub struct AlertSchedule {
    fired: HashSet<AlertStage>,
}

impl AlertSchedule {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn due(&mut self, tip: u64) -> Vec<AlertStage> {
        let mut ready = Vec::new();

        for stage in AlertStage::ALL {
            if stage.window().contains(&tip) && self.fired.insert(stage) {
                ready.push(stage);
            }
        }

        ready
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn each_stage_triggers_at_the_documented_distance() {
        assert_eq!(
            AlertStage::FortyEightHours.trigger_height(),
            IRONWOOD_ACTIVATION_HEIGHT - 2_304
        );
        assert_eq!(
            AlertStage::OneHour.trigger_height(),
            IRONWOOD_ACTIVATION_HEIGHT - 48
        );
        assert_eq!(
            AlertStage::Activation.trigger_height(),
            IRONWOOD_ACTIVATION_HEIGHT
        );
    }

    #[test]
    fn nothing_fires_before_a_window_opens() {
        let mut schedule = AlertSchedule::new();
        let trigger = AlertStage::FortyEightHours.trigger_height();

        assert!(schedule.due(trigger - 1).is_empty());
    }

    #[test]
    fn a_stage_fires_exactly_once_inside_its_window() {
        let mut schedule = AlertSchedule::new();
        let trigger = AlertStage::FortyEightHours.trigger_height();

        assert_eq!(schedule.due(trigger), vec![AlertStage::FortyEightHours]);
        assert!(schedule.due(trigger + 1).is_empty());
    }

    #[test]
    fn the_last_block_of_the_window_still_fires() {
        let mut schedule = AlertSchedule::new();
        let trigger = AlertStage::FortyEightHours.trigger_height();

        assert_eq!(
            schedule.due(trigger + FIRE_WINDOW_BLOCKS - 1),
            vec![AlertStage::FortyEightHours]
        );
    }

    #[test]
    fn a_stage_window_never_reaches_past_the_next_trigger() {
        let mut schedule = AlertSchedule::new();

        assert_eq!(
            schedule.due(IRONWOOD_ACTIVATION_HEIGHT),
            vec![AlertStage::Activation],
            "a restart at activation must never send a stale one-hour countdown"
        );
    }

    #[test]
    fn a_restart_long_after_a_threshold_stays_silent_instead_of_spamming() {
        let mut schedule = AlertSchedule::new();
        let trigger = AlertStage::FortyEightHours.trigger_height();

        assert!(schedule.due(trigger + FIRE_WINDOW_BLOCKS).is_empty());
    }

    #[test]
    fn a_jump_past_an_expired_window_fires_only_the_open_one() {
        let mut schedule = AlertSchedule::new();
        let tip = AlertStage::OneHour.trigger_height();

        assert_eq!(schedule.due(tip), vec![AlertStage::OneHour]);
    }

    #[test]
    fn activation_fires_at_the_activation_height_itself() {
        let mut schedule = AlertSchedule::new();

        assert_eq!(
            schedule.due(IRONWOOD_ACTIVATION_HEIGHT),
            vec![AlertStage::Activation]
        );
    }

    #[test]
    fn every_body_names_the_activation_height_and_links_an_action() {
        for stage in AlertStage::ALL {
            let body = stage.body("https://example.org/");
            assert!(body.contains(&IRONWOOD_ACTIVATION_HEIGHT.to_string()));
            assert!(
                body.contains("https://example.org/check")
                    || body.contains("https://example.org/guides")
            );
            assert!(!body.contains("example.org//"));
        }
    }
}
