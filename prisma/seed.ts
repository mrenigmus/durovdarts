import "module-alias/register";
import { prisma } from "@/utils/prisma";
import { Settings } from "@/generated/prisma";
import { setSetting } from "@/utils/settings";

async function main() {
  await Promise.all([
    setSetting("ref:reward", 10, "Int"),
    setSetting("partner:reward", 10, "Int"),
  ]);

  const gifts = [
    {
      giftId: "5170145012310081615",
      price: 15,
    },
    {
      giftId: "5170233102089322756",
      price: 15,
    },
    {
      giftId: "5170250947678437525",
      price: 25,
    },
    {
      giftId: "5168103777563050263",
      price: 25,
    },
    {
      giftId: "5170144170496491616",
      price: 50,
    },
    {
      giftId: "5170314324215857265",
      price: 50,
    },
    {
      giftId: "5170564780938756245",
      price: 50,
    },
    {
      giftId: "6028601630662853006",
      price: 50,
    },
    {
      giftId: "5168043875654172773",
      price: 100,
    },
    {
      giftId: "5170690322832818290",
      price: 100,
    },
    {
      giftId: "5170521118301225164",
      price: 100,
    },
  ];

  await prisma.gift.createMany({
    data: gifts,
  });
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
