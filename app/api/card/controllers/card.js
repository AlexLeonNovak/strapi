module.exports = {
  findOne: async (ctx) => {
    // const id = ctx.params.id;
    const { id } = ctx.params;

    try {
      const result = await strapi
        .query("profile")
        .model.query((qb) => {
          qb.where("card_uid", id);
        })
        .fetch();

      const fields = result.toJSON();

      if (fields.site_url) {
        return ctx.redirect("//" + fields.site_url);
      } else {
        return ctx.redirect("//app.leagent.com/p/" + fields.profile_slug);
      }
    } catch (e) {
      return ctx.redirect("https://leagent.com");
    }
  },
};
