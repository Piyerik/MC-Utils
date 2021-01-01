import { Command } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";
import memberModel from "../../models/MemberModel";
import { getModelForClass } from "@typegoose/typegoose";

export default class DelWarn extends Command {
  public constructor() {
    super("delwarn", {
      aliases: ["delwarn", "rmpunish"],
      category: "Moderation",
      channel: "guild",
      description: {
        content: "Remove a warning from a user.",
        usage: "delwarn [ID]",
        examples: ["delwarn 293003", "ban 203940220939"],
      },
      ratelimit: 3,
      userPermissions: ["MANAGE_MESSAGES"],
      args: [
        {
          id: "id",
          type: "string",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a valid case ID to delete...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid case ID to delete...`,
          },
        },
        {
          id: "reason",
          type: "string",
          match: "rest",
          default: "No reason provided.",
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { id, reason }: { id: string; reason: string }
  ): Promise<void | Message> {
    const embed = new MessageEmbed().setColor(0x1abc9c);
    const sanctionsModel = getModelForClass(memberModel);
    try {
      var pendingDeletion = await sanctionsModel.findOne({
        guildId: message.guild.id,
        "sanctions.caseID": id,
      });
      if (!pendingDeletion.sanctions) {
        embed.setDescription("No modlogs found for the user.");
        return message.util.send(embed);
      } else if (
        pendingDeletion.sanctions === null ??
        pendingDeletion.sanctions === undefined ??
        !pendingDeletion.sanctions.filter((n) => n.caseID === id)
      ) {
        embed.setDescription(`Couldn't find warn ID \`${id}\``);
        return message.util.send(embed);
      }
    } catch (e) {
      embed.setDescription(`Couldn't find warn ID \`${id}\``);
      return message.util.send(embed);
    }
    if (
      pendingDeletion.sanctions.filter(
        (r) => r.caseID === id && r.moderatorId !== message.author.id
      )
    ) {
      if (
        message.member.roles.cache.has("726771392913080421") ||
        message.member.permissions.has("ADMINISTRATOR") ||
        message.member.permissions.has("MANAGE_GUILD")
      ) {
        //Hmod Role OR Admin OR Manage Guild
        try {
          await sanctionsModel.findOneAndDelete({
            guildId: message.guild.id,
            "sanctions.caseID": id,
          });
          await message.util.send(`Case ID ${id} has been deleted.`);
        } catch (e) {
          embed.setDescription(`Error occurred while deleting case: **${e}**`);
          return message.util.send(embed);
        }
      } else {
        embed.setDescription(
          "You cannot delete this case because it is not yours."
        );
        return message.util.send(embed);
      }
    }
    try {
      await sanctionsModel.findOneAndDelete({
        guildId: message.guild.id,
        "sanctions.caseID": id,
      });
      await message.util.send(`Case ID ${id} has been deleted.`);
    } catch (e) {
      embed.setDescription(`Error occurred while deleting case: **${e}**`);
      return message.util.send(embed);
    }
  }
}
