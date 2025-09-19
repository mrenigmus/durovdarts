need-username = 😕 To use the bot, set a @username in your Telegram settings
main-menu = 📋 Main Menu
action-canceled = ❌ Action canceled
cancel = ❌ Cancel
notify =
        .rewards = <b>🔥 Free stars are available for you!</b>
        .rewards-receive = ⭐️ Claim
start =
    .free = 🔥 {$count} ⭐️ • free
    .ref = 👤 {$count} ⭐️ • for a friend
    .text = 
            <b>🎯 Hi, {$name}!</b>

            💰 Balance: <b>{$balance} ⭐️</b>

            <blockquote><b>To get a gift, you must hit the center of <u>all targets</u> 🎁</b>
            <i>An NFT gift can only be won in games with the 💎 icon</i></blockquote>
referral =
    .text = 
            <b>👤 Get {$count} ⭐️ to your balance for each friend!</b>

            🎯 Condition: <b>your friend must throw at least 5 darts</b>
    .share = ↪️ Share
    .share-text = 
                🎯 Will you hit the bullseye? Durov gives NFT gifts!

                {$url}
games =
    .spinning = <b>🎯 Throwing...</b>
    .spinning-nft = 
                    <b>🎯 Throwing...</b>

                    <b>🎁 If one of these gifts appears: {$nftGifts} - You’ll receive a random NFT!</b>
    .not-found = ❌ Game not found
    .no-gifts = ❌ No gifts available
    .not-enough-funds = ❌ Not enough stars on balance
    .spin = 🎯 Throw again
    .lose = <b>😔 You lost!</b>
    .miss = Miss
    .hit = Hit
    .win = <b>🎉 Congratulations, you won!</b>
    .win-nft = 
                <b>🎉 Congratulations, you won an NFT!</b>

                <i>ℹ️ To claim your gift, send any message to @{$username}, after that the bot will automatically send you the gift within a few minutes</i>
    .error =
            <b>⚠️ Error while sending the gift</b>
partners =
    .text = 
            <b>🎯 Complete all tasks and get free stars to your balance ⭐️</b>
    .subscribe = 📢 Subscribe
    .run = 🤖 Start
    .check = ✅ Check
    .error = ❌ You haven’t completed all tasks
    .success = <b>✅ Tasks completed!</b> <b>{$amount} ⭐️</b> have been credited to your balance
    .timeout = ⚠️ You can get the next bonus in 24 hours
plurals =
        .darts = {$count} { $count ->
                [0] darts
                [one] dart
                *[other] darts
                }
back = ◀️ Back
not-specified = ❓ Not specified
skip = ❌ Skip
