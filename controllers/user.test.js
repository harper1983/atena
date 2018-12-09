import request from "supertest";
import mongoose from "mongoose";
import sinon from "sinon";
import factory from "factory-girl";
import crypto from "crypto";
import qs from "qs";
import app from "../index";
import User from "../models/user";
require("sinon-mongoose");

describe("[Controllers] User", () => {
  describe("## Routes", () => {
    let MOCK_BODY = {
      token: "4l0c3fKgSeeDGqniR30aQf1O",
      team_id: "TCXCXJC5S",
      team_domain: "impulso-sandbox",
      channel_id: "CCWSMJZ6U",
      channel_name: "general",
      user_id: "UCZCQH7CG",
      user_name: "goldblade",
      command: "/meuspontos-goldblade",
      text: "",
      response_url:
        "https://hooks.slack.com/commands/TCXCXJC5S/495910309186/CqLIVC5j2Q8f6zVYwkbjRQ14",
      trigger_id: "495742047108.439439624196.324159fbe295cb6754006b3afb523a1c"
    };

    let MOCK_MSG = {
      client_msg_id: "a7cb01dd-913b-48cd-abcf-a71d603918e4",
      type: "message",
      text: "o/",
      user: "UCZCQH7CG",
      ts: "1544299021.000600",
      channel: "CCWSMJZ6U",
      event_ts: "1544299021.000600",
      channel_type: "channel"
    };

    let time;
    let slackSignature;

    beforeEach(() => {
      time = Math.floor(new Date().getTime() / 1000);
      const requestBody = qs.stringify(MOCK_BODY, { format: "RFC1738" });
      const sigBaseString = `v0:${time}:${requestBody}`;
      const slackSecret = process.env.SLACK_SIGNIN_EVENTS;
      const hmac = crypto
        .createHmac("sha256", slackSecret)
        .update(sigBaseString, "utf8")
        .digest("hex");
      slackSignature = `v0=${hmac}`;
    });

    describe("### Bot", () => {
        describe("#### POST Score", () => {
        it("should return the message user has not scored points yet", done => {
          request(app)
            .post("/bot/commands/score")
            .set("x-slack-request-timestamp", time)
            .set("x-slack-signature", slackSignature)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .send(MOCK_BODY)
            .then(res => {
              expect(res.body.text).toEqual(
                "Ops! Você ainda não tem pontos registrados."
              );
              expect(res.statusCode).toBe(200);
              done();
            });
        });

        it("should return the message with user position and total points", done => {
          var user = {
            name: "Seya",
            level: 1,
            score: 1,
            slackId: "UCZCQH7CG",
            avatar: ""
          };
          factory.define("User", User, user);

          const UserModel = mongoose.model("User");

          factory.build("User", user).then(userDocument => {
            user = userDocument;
            var userMock = sinon.mock(user);
            userMock.expects("save").resolves(user);
            sinon
              .mock(UserModel)
              .expects("findOne")
              .chain("exec")
              .resolves(user);

            request(app)
              .post("/bot/commands/score")
              .set("x-slack-request-timestamp", time)
              .set("x-slack-signature", slackSignature)
              .set("Content-Type", "application/x-www-form-urlencoded")
              .send(MOCK_BODY)
              .then(res => {
                expect(res.body.text).toEqual(
                  `Olá ${user.name}, atualmente você está no nível ${
                    user.level
                  } com ${user.score} XP`
                );
                expect(res.statusCode).toBe(200);
                done();
              });
          });
        });
      });

      describe("#### POST Ranking", () => {
        it("should return the ranking successfully", done => {
          request(app)
            .post("/bot/commands/ranking")
            .set("x-slack-request-timestamp", time)
            .set("x-slack-signature", slackSignature)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .send(MOCK_BODY)
            .then(res => {
              expect(res.statusCode).toBe(200);
              done();
            });
        });

        describe("### POST CoreTeamRanking", () => {
          it("alguma coisa", done => {
            request(app)
              .post("/bot/commands/coreteamranking")
              .set("x-slack-request-timestamp", time)
              .set("x-slack-signature", slackSignature)
              .set("Content-Type", "application/x-www-form-urlencoded")
              .send(MOCK_BODY)
              .then(res => {
                expect(res.statusCode).toBe(200);
                done();
              });
          });
        });
      });
    });
  });
});
