<template>
  <section v-if="$store.state.user" class="container">
    <img src="~assets/img/logo.png" alt="Nuxt.js Logo" class="logo">
    <h1 class="title">User</h1>
    <h2 class="info">{{ user.name }}</h2>
    <nuxt-link class="button" to="/">Users</nuxt-link>
  </section>
</template>

<script>
import axios from "axios";


export default {
  name: "id",
  asyncData({ params, error }) {
    return axios
      .get("/api/users/" + params.id)
      .then(res => {
        return { user: res.data };
      })
      .catch(e => {
        error({ statusCode: 404, message: "User not found" });
      });
  },
  head() {
    return {
      title: `User: ${this.user.name}`
    };
  },  
  created() {
    if (!this.$store.state.user) {
      this.$router.push( "/login");
      return;
    }
  },
   
  
};
</script>

<style scoped>
.title {
  margin-top: 30px;
}

.info {
  font-weight: 300;
  color: #9aabb1;
  margin: 0;
  margin-top: 10px;
}

.button {
  margin-top: 30px;
}

.container {
  text-align: center;
}
</style>
