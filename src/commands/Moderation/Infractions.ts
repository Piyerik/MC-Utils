import { Command } from "discord-akairo";
import { Message, GuildMember, MessageEmbed } from "discord.js";
import { getModelForClass } from "@typegoose/typegoose";
import MemberModel from "../../models/MemberModel";

export default class Infractions extends Command {
  public constructor() {
    super("infractions", {
      aliases: ["infractions", "modlogs"],
      category: "Moderation",
      channel: "guild",
      userPermissions: ["MANAGE_MESSAGES"],
      description: {
        content: "Check infractions (modlogs) of a member.",
        usage: "infractions [member]",
        examples: ["infractions @Axis#0001"],
      },
      ratelimit: 3,
      args: [
        {
          id: "member",
          type: "member" ?? "memberMention",
          default: (msg: Message) => msg.member,
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { member }: { member: GuildMember }
  ): Promise<Message> {
    const embed = new MessageEmbed().setColor(0x00ff0c);
    let userId = member.id;
    const sanctionsModel = getModelForClass(MemberModel);
    try {
      var memberData = await sanctionsModel.findOne({
        id: userId,
        guildId: message.guild.id,
      });
      if (!memberData) {
        embed.setDescription(`No modlogs found for that user`);
        return message.util.send(embed);
      } else if (
        memberData.sanctions === null ??
        memberData.sanctions.length < 1 ??
        memberData.sanctions === undefined
      ) {
        embed.setDescription(`No modlogs found for that user`);
        return message.util.send(embed);
      }
    } catch (e) {}
    embed.setAuthor(
      `${member.user.tag}'s Modlogs`,
      member.user.displayAvatarURL({ dynamic: true })
    );
    embed.setDescription("All times are in UTC");
    for (const s of memberData.sanctions) {
      embed.addField(
        s.type + " | #" + s.caseID,
        `Moderator: **${s.moderator}**\nReason: **${s.reason}**\nDate: **${s.date}**`,
        false
      );
    }
    embed.setFooter(`ID: ${userId}`);
    return message.util.send(embed);
  }
}
