need-username = 😕 To use the bot, set a @username in your Telegram settings
main-menu = 📋 Main Menu
start =
    .free = 🔥 {$count} ⭐️ • free
    .ref = 👤 {$count} ⭐️ • for a friend
    .text = 
            <b>🎯 Hi, {$name}!</b>

            💰 Balance: <b>{$balance} ⭐️</b>

            <blockquote><b>To receive a gift, you need to hit the center of <u>all targets</u> 🎁</b>
            <i>An NFT gift can only be won in games marked with the 💎 symbol</i></blockquote>
referral =
    .text = 
            <b>👤 Get {$count} ⭐️ to your balance for every friend!</b>

            🎯 Condition: <b>a friend must throw at least 5 darts</b>
    .share = ↪️ Share
    .share-text = 
                🎯 Can you hit the bullseye? Durov gives NFT gifts!

                {$url}
games =
    .spinning = <b>🎯 Throwing...</b>
    .spinning-nft = 
                    <b>🎯 Throwing...</b>

                    <b>🎁 If one of the gifts drops: {$nftGifts} - You’ll get a random NFT!</b>
    .not-found = ❌ Game not found
    .no-gifts = ❌ No available gifts
    .not-enough-funds = ❌ Not enough stars on balance
    .spin = 🎯 Throw again
    .lose = <b>❌ You lost!</b>
    .win = <b>🎉 Congratulations, you won!</b>
    .win-nft = 
                <b>🎉 Congratulations, you won an NFT!</b>

                <i>ℹ️ To receive the gift, send any message to @{$username}, and the bot will automatically send you the gift within a few minutes</i>
    .error =
            <b>⚠️ Error while sending the gift</b>
partners =
    .text = 
            <b>🎯 Complete all tasks and get free stars ⭐️ to your balance</b>
    .subscribe = 📢 Subscribe
    .run = 🤖 Run
    .check = ✅ Check
    .error = ❌ You haven’t completed all tasks
    .success = <b>✅ Tasks completed!</b> Your balance has been credited with <b>{$amount} ⭐️</b>
    .timeout = ⚠️ You can claim the next bonus in 24 hours
plurals =
        .darts = {$count} { $count ->
                [0] darts
                [one] dart
                [few] darts
                [many] darts
                *[other] darts 
                }
back = ◀️ Back
not-specified = ❓ Not specified
skip = ❌ Skip
