use anyhow::Result;
use clap::Parser;
use turnstile_core::pools::format_pool;
use turnstile_core::{IRONWOOD_ACTIVATION_HEIGHT, ScanBackend, ScanRequest, ScanResult, Verdict};

#[derive(Parser)]
#[command(
    name = "turnstile-check",
    about = "Check whether your ZEC is exposed to the Ironwood Orchard pool closure",
    long_about = "Scans a Zcash wallet from a unified full viewing key and reports the balance \
                  in each pool. Runs entirely on your machine. Never accepts a spending key."
)]
struct Args {
    #[arg(
        long,
        value_name = "UFVK",
        help = "Unified full viewing key (uview1...)"
    )]
    ufvk: String,

    #[arg(long, value_name = "HEIGHT", help = "Wallet birthday block height")]
    birthday: u64,

    #[arg(
        long,
        value_name = "URL",
        help = "lightwalletd endpoint",
        default_value = "https://zec.rocks:443"
    )]
    server: String,

    #[arg(long, help = "Print the result as JSON")]
    json: bool,

    #[arg(long, help = "Print how long the sync took and the block rate")]
    bench: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    let request = ScanRequest {
        ufvk: args.ufvk,
        birthday: args.birthday,
    };

    if !args.json {
        eprintln!("Scanning from block {}…", args.birthday);
    }

    let started = std::time::Instant::now();
    let result = ScanBackend::new(args.server.clone()).scan(&request).await?;
    let elapsed = started.elapsed();

    if args.json {
        let mut output = serde_json::to_value(result)?;
        if args.bench {
            output["benchmark"] = benchmark_json(&args.server, &result, elapsed);
        }
        println!("{}", serde_json::to_string_pretty(&output)?);
    } else {
        print_verdict(&result);
        if args.bench {
            print_benchmark(&args.server, &result, elapsed);
        }
    }

    Ok(())
}

fn blocks_scanned(result: &ScanResult) -> u64 {
    result
        .scanned_to_height
        .saturating_sub(result.scanned_from_height)
        + 1
}

fn blocks_per_second(blocks: u64, elapsed: std::time::Duration) -> f64 {
    blocks as f64 / elapsed.as_secs_f64().max(f64::EPSILON)
}

fn benchmark_json(
    server: &str,
    result: &ScanResult,
    elapsed: std::time::Duration,
) -> serde_json::Value {
    let blocks = blocks_scanned(result);
    serde_json::json!({
        "server": server,
        "scannedFromHeight": result.scanned_from_height,
        "scannedToHeight": result.scanned_to_height,
        "blocks": blocks,
        "elapsedSeconds": elapsed.as_secs_f64(),
        "blocksPerSecond": blocks_per_second(blocks, elapsed),
    })
}

fn print_benchmark(server: &str, result: &ScanResult, elapsed: std::time::Duration) {
    let blocks = blocks_scanned(result);

    println!("  BENCHMARK");
    println!("  SERVER        {server}");
    println!(
        "  BLOCKS        {} → {} ({blocks})",
        result.scanned_from_height, result.scanned_to_height
    );
    println!("  ELAPSED       {:.1}s", elapsed.as_secs_f64());
    println!(
        "  RATE          {:.0} blocks/s",
        blocks_per_second(blocks, elapsed)
    );
    println!();
}

fn print_verdict(result: &ScanResult) {
    let balances = result.balances;

    println!();
    println!("  TRANSPARENT   {}", format_pool(balances.transparent));
    println!("  SAPLING       {}", format_pool(balances.sapling));
    println!("  ORCHARD       {}", format_pool(balances.orchard));
    println!();
    println!("  {}", result.verdict.headline());
    println!("  {}", result.verdict.detail());

    if result.verdict == Verdict::Exposed {
        println!("  Activation is at block {IRONWOOD_ACTIVATION_HEIGHT}.");
    }

    println!(
        "  Scanned blocks {} to {}.",
        result.scanned_from_height, result.scanned_to_height
    );

    if result.verdict != Verdict::Exposed
        && result.scanned_from_height > turnstile_core::chain::ORCHARD_ACTIVATION_HEIGHT
    {
        println!(
            "  Note: Orchard funds received before block {} were not counted. Re-run with an \
             earlier --birthday, or omit it, to be certain.",
            result.scanned_from_height
        );
    }
    println!();
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use turnstile_core::PoolBalances;

    use super::*;

    fn scanned(from: u64, to: u64) -> ScanResult {
        ScanResult::new(PoolBalances::fully_visible(0, 0, 0), from, to)
    }

    #[test]
    fn counts_scanned_blocks_inclusively() {
        assert_eq!(blocks_scanned(&scanned(100, 100)), 1);
        assert_eq!(blocks_scanned(&scanned(3_058_569, 3_419_794)), 361_226);
    }

    #[test]
    fn rate_is_blocks_over_seconds() {
        assert_eq!(blocks_per_second(2_000, Duration::from_secs(2)), 1_000.0);
    }

    #[test]
    fn a_zero_duration_never_divides_by_zero() {
        assert!(blocks_per_second(1_000, Duration::ZERO).is_finite());
    }

    #[test]
    fn the_json_benchmark_carries_the_fields_stat_collectors_need() {
        let value = benchmark_json(
            "https://zec.rocks:443",
            &scanned(10, 19),
            Duration::from_secs(5),
        );

        assert_eq!(value["server"], "https://zec.rocks:443");
        assert_eq!(value["blocks"], 10);
        assert_eq!(value["elapsedSeconds"], 5.0);
        assert_eq!(value["blocksPerSecond"], 2.0);
    }
}
