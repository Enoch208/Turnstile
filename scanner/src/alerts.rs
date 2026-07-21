use std::collections::HashSet;
use std::time::Duration;

use turnstile_core::{AlertSchedule, MemoWatcher, chain_tip, notify};

const POLL_INTERVAL: Duration = Duration::from_secs(120);
const DEFAULT_SITE_URL: &str = "https://turnstile-xi.vercel.app";

pub fn spawn(indexer_uri: String, ntfy_base: String) {
    let Some(mut watcher) = MemoWatcher::from_env(indexer_uri.clone()) else {
        tracing::warn!(
            "TURNSTILE_UFVK not set — the memo watcher is disabled and no alerts will be sent"
        );
        return;
    };

    let site_url =
        std::env::var("TURNSTILE_SITE_URL").unwrap_or_else(|_| DEFAULT_SITE_URL.to_string());

    tokio::spawn(async move {
        tracing::info!("memo watcher started");

        let mut topics: HashSet<String> = HashSet::new();
        let mut schedule = AlertSchedule::new();

        loop {
            match watcher.poll().await {
                Ok(subscriptions) => {
                    for subscription in subscriptions {
                        tracing::info!(
                            topic = %subscription.topic,
                            height = subscription.height,
                            "new subscription"
                        );

                        topics.insert(subscription.topic.clone());

                        let confirmation = notify(
                            &ntfy_base,
                            &subscription.topic,
                            "Turnstile — you are subscribed",
                            "You will be alerted 48 hours before, 1 hour before, and at the \
                             Ironwood activation. No email, no account, no way to identify you.",
                        )
                        .await;

                        if let Err(error) = confirmation {
                            tracing::warn!(%error, "could not send the confirmation push");
                        }
                    }
                }
                Err(error) => tracing::warn!(%error, "memo poll failed"),
            }

            match chain_tip(&indexer_uri).await {
                Ok(tip) => {
                    for stage in schedule.due(tip) {
                        tracing::info!(
                            ?stage,
                            tip,
                            subscribers = topics.len(),
                            "broadcasting activation alert"
                        );

                        for topic in &topics {
                            let push =
                                notify(&ntfy_base, topic, stage.title(), &stage.body(&site_url))
                                    .await;

                            if let Err(error) = push {
                                tracing::warn!(topic = %topic, %error, "alert push failed");
                            }
                        }
                    }
                }
                Err(error) => tracing::warn!(%error, "tip poll failed"),
            }

            tokio::time::sleep(POLL_INTERVAL).await;
        }
    });
}
