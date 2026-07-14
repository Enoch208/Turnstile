use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use serde::Serialize;
use tokio::sync::Mutex;
use turnstile_core::{ScanError, ScanRequest, ScanResult};

const JOB_TTL: Duration = Duration::from_secs(30 * 60);

#[derive(Clone, Serialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum JobState {
    Running,
    Done { result: ScanResult },
    Failed { error: String },
}

pub struct Jobs {
    inner: Arc<Mutex<HashMap<String, (JobState, Instant)>>>,
    next_id: Arc<Mutex<u64>>,
}

impl Default for Jobs {
    fn default() -> Self {
        Self::new()
    }
}

impl Jobs {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(HashMap::new())),
            next_id: Arc::new(Mutex::new(0)),
        }
    }

    async fn mint_id(&self) -> String {
        let mut next = self.next_id.lock().await;
        *next += 1;

        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.subsec_nanos())
            .unwrap_or(0);

        format!("{:x}{:x}", nanos, *next)
    }

    pub async fn get(&self, id: &str) -> Option<JobState> {
        let jobs = self.inner.lock().await;
        jobs.get(id).map(|(state, _)| state.clone())
    }

    async fn set(&self, id: &str, state: JobState) {
        let mut jobs = self.inner.lock().await;
        jobs.retain(|_, (_, at)| at.elapsed() < JOB_TTL);
        jobs.insert(id.to_string(), (state, Instant::now()));
    }

    pub async fn spawn<F, Fut>(&self, request: ScanRequest, run: F) -> String
    where
        F: FnOnce(ScanRequest) -> Fut + Send + 'static,
        Fut: std::future::Future<Output = Result<ScanResult, ScanError>> + Send,
    {
        let id = self.mint_id().await;
        self.set(&id, JobState::Running).await;

        let jobs = Self {
            inner: Arc::clone(&self.inner),
            next_id: Arc::clone(&self.next_id),
        };
        let job_id = id.clone();
        let birthday = request.birthday;

        tokio::spawn(async move {
            tracing::info!(job = %job_id, birthday, "scan started");

            let state = match run(request).await {
                Ok(result) => {
                    tracing::info!(
                        job = %job_id,
                        verdict = ?result.verdict,
                        scanned_to_height = result.scanned_to_height,
                        "scan complete"
                    );
                    JobState::Done { result }
                }
                Err(error) => {
                    tracing::warn!(job = %job_id, %error, "scan failed");
                    JobState::Failed {
                        error: error.to_string(),
                    }
                }
            };

            jobs.set(&job_id, state).await;
        });

        id
    }
}
