use anyhow::Result;
use clap::Parser;
use turnstile_core::pools::format_zec;
use turnstile_core::scan::validate;
use turnstile_core::{IRONWOOD_ACTIVATION_HEIGHT, ScanRequest, ScanResult, Verdict};

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

    #[arg(long, help = "Print the result as JSON")]
    json: bool,
}

fn main() -> Result<()> {
    let args = Args::parse();
    let request = ScanRequest {
        ufvk: args.ufvk,
        birthday: args.birthday,
    };

    validate(&request, IRONWOOD_ACTIVATION_HEIGHT)?;

    let result = scan_locally(&request)?;

    if args.json {
        println!("{}", serde_json::to_string_pretty(&result)?);
    } else {
        print_verdict(&result);
    }

    Ok(())
}

fn scan_locally(_request: &ScanRequest) -> Result<ScanResult> {
    anyhow::bail!("local zingolib scanning is not wired up yet")
}

fn print_verdict(result: &ScanResult) {
    let balances = result.balances;

    println!();
    println!("  TRANSPARENT   {} ZEC", format_zec(balances.transparent));
    println!("  SAPLING       {} ZEC", format_zec(balances.sapling));
    println!("  ORCHARD       {} ZEC", format_zec(balances.orchard));
    println!();

    match result.verdict {
        Verdict::Exposed => println!(
            "  EXPOSED — {} ZEC sits in Orchard. Migrate before block {IRONWOOD_ACTIVATION_HEIGHT}.",
            format_zec(balances.orchard)
        ),
        Verdict::Partial => println!(
            "  NOT SEALED — your funds are in Sapling or transparent. Nothing is at risk, but read what changes."
        ),
        Verdict::Ready => println!("  READY — nothing in Orchard."),
    }

    println!("  Scanned to block {}.", result.scanned_to_height);
    println!();
}
