// =====================================================
// NDAMBUKI ART LAB — ART CLASS COMMUNITY
// Public feed: posts + likes + comments
// =====================================================

const communityGrid = document.getElementById("communityGrid");

let artClassPosts = [];
let visitorId = localStorage.getItem("ndambuki_visitor_id");

// Create a unique visitor ID for likes
if (!visitorId) {
  visitorId = crypto.randomUUID();
  localStorage.setItem("ndambuki_visitor_id", visitorId);
}


// =====================================================
// LOAD POSTS
// =====================================================

async function loadArtClassPosts() {

  if (!communityGrid) return;

  communityGrid.innerHTML = `
    <div class="feed-loading">
      Loading the Art Lab...
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("art_class_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {

    console.error("Art Class posts error:", error);

    communityGrid.innerHTML = `
      <div class="feed-empty">
        <p>We couldn't load the Art Lab right now.</p>
      </div>
    `;

    return;
  }

  artClassPosts = data || [];

  if (!artClassPosts.length) {

    communityGrid.innerHTML = `
      <div class="feed-empty">
        <p>No Art Lab posts yet.</p>
      </div>
    `;

    return;
  }

  renderArtClassPosts();
}


// =====================================================
// RENDER POSTS
// =====================================================

async function renderArtClassPosts() {

  const cards = await Promise.all(
    artClassPosts.map(async (post, index) => {

      const { count } = await supabaseClient
        .from("art_class_comments")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("post_id", post.id);

      const commentCount = count || 0;

      const sizeClass = getCardSize(index, post);

      const liked = await hasLiked(post.id);

      return createPostCard(
        post,
        commentCount,
        liked,
        sizeClass
      );

    })
  );

  communityGrid.innerHTML = cards.join("");
}


// =====================================================
// BENTO CARD SIZING
// =====================================================

function getCardSize(index, post) {

  if (post.featured) {
    return "large";
  }

  const pattern = index % 6;

  if (pattern === 1) return "wide";
  if (pattern === 2) return "tall";
  if (pattern === 4) return "large";

  return "";
}


// =====================================================
// CREATE CARD
// =====================================================

function createPostCard(
  post,
  commentCount,
  liked,
  sizeClass
) {

  const safeTitle = escapeHTML(post.title || "");
  const safeDescription =
    escapeHTML(post.description || "");

  const safeCategory =
    escapeHTML(post.category || "Art Lab");

  const image =
    post.image_url ||
    "../images/placeholder.jpg";

  const likes =
    Number(post.likes_count || 0);

  return `

    <article
      class="community-card ${sizeClass}"
      data-post-id="${post.id}"
    >

      <img
        src="${escapeAttribute(image)}"
        alt="${escapeAttribute(safeTitle)}"
        loading="lazy"
      >

      <div class="card-gradient"></div>

      <div class="card-content">

        <span class="card-category">
          ${safeCategory}
        </span>

        <h3>
          ${safeTitle}
        </h3>

        ${
          safeDescription
            ? `<p>${safeDescription}</p>`
            : ""
        }

        <div class="card-actions">

          <button
            class="card-action like-button ${liked ? "liked" : ""}"
            onclick="toggleArtClassLike('${post.id}')"
            aria-label="Like post"
          >

            <span class="heart">
              ${liked ? "♥" : "♡"}
            </span>

            <span class="like-count">
              ${likes}
            </span>

          </button>


          <button
            class="card-action comment-button"
            onclick="openComments('${post.id}')"
          >

            💬

            <span>
              ${commentCount}
            </span>

          </button>

        </div>

      </div>

      <!-- COMMENTS PANEL -->

      <div
        class="comments-panel"
        id="comments-${post.id}"
      >

        <div class="comments-header">

          <h4>
            Comments
          </h4>

          <button
            class="close-comments"
            onclick="closeComments('${post.id}')"
          >
            ×
          </button>

        </div>


        <div
          class="comment-list"
          id="comment-list-${post.id}"
        >
          Loading comments...
        </div>


        <form
          class="comment-form"
          onsubmit="submitComment(event, '${post.id}')"
        >

          <input
            type="text"
            id="comment-name-${post.id}"
            placeholder="Your name"
            maxlength="50"
            required
          >

          <textarea
            id="comment-text-${post.id}"
            placeholder="Write a comment..."
            maxlength="500"
            required
          ></textarea>

          <button type="submit">
            Post Comment
          </button>

        </form>

      </div>

    </article>
  `;
}


// =====================================================
// CHECK IF VISITOR LIKED
// =====================================================

async function hasLiked(postId) {

  const { data, error } = await supabaseClient
    .from("art_class_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (error) {
    console.error("Like check error:", error);
    return false;
  }

  return !!data;
}


// =====================================================
// LIKE / UNLIKE
// =====================================================

async function toggleArtClassLike(postId) {

  const { data: existing, error: checkError } =
    await supabaseClient
      .from("art_class_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("visitor_id", visitorId)
      .maybeSingle();

  if (checkError) {

    console.error(checkError);

    alert("We couldn't process your like.");

    return;
  }


  if (existing) {

    const { error } = await supabaseClient
      .from("art_class_likes")
      .delete()
      .eq("id", existing.id);

    if (error) {

      console.error(error);

      alert("Unable to remove like.");

      return;
    }

  } else {

    const { error } = await supabaseClient
      .from("art_class_likes")
      .insert({
        post_id: postId,
        visitor_id: visitorId
      });

    if (error) {

      console.error(error);

      alert("Unable to like this post.");

      return;
    }
  }


  // Recalculate likes from database
  const { count, error: countError } =
    await supabaseClient
      .from("art_class_likes")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("post_id", postId);

  if (countError) {

    console.error(countError);

    return;
  }


  await supabaseClient
    .from("art_class_posts")
    .update({
      likes_count: count || 0
    })
    .eq("id", postId);


  loadArtClassPosts();
}


// =====================================================
// OPEN COMMENTS
// =====================================================

async function openComments(postId) {

  const panel =
    document.getElementById(`comments-${postId}`);

  if (!panel) return;

  panel.classList.add("active");

  const list =
    document.getElementById(`comment-list-${postId}`);

  list.innerHTML = "Loading comments...";


  const { data, error } = await supabaseClient
    .from("art_class_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    list.innerHTML = `
      <p>Unable to load comments.</p>
    `;

    return;
  }


  if (!data || !data.length) {

    list.innerHTML = `
      <p style="opacity:.65;">
        No comments yet. Be the first to comment.
      </p>
    `;

    return;
  }


  list.innerHTML = data.map(comment => `

    <div class="comment">

      <strong>
        ${escapeHTML(comment.name || "Anonymous")}
      </strong>

      <p>
        ${escapeHTML(comment.comment || "")}
      </p>

    </div>

  `).join("");
}


// =====================================================
// CLOSE COMMENTS
// =====================================================

function closeComments(postId) {

  const panel =
    document.getElementById(`comments-${postId}`);

  if (panel) {
    panel.classList.remove("active");
  }
}


// =====================================================
// SUBMIT COMMENT
// =====================================================

async function submitComment(event, postId) {

  event.preventDefault();

  const nameInput =
    document.getElementById(`comment-name-${postId}`);

  const commentInput =
    document.getElementById(`comment-text-${postId}`);


  const name =
    nameInput.value.trim();

  const comment =
    commentInput.value.trim();


  if (!name || !comment) {
    return;
  }


  const button =
    event.submitter;

  if (button) {
    button.disabled = true;
    button.textContent = "Posting...";
  }


  const { error } = await supabaseClient
    .from("art_class_comments")
    .insert({
      post_id: postId,
      name: name,
      comment: comment
    });


  if (error) {

    console.error(error);

    alert(
      "We couldn't post your comment. Please try again."
    );

    if (button) {
      button.disabled = false;
      button.textContent = "Post Comment";
    }

    return;
  }


  nameInput.value = "";
  commentInput.value = "";

  if (button) {
    button.disabled = false;
    button.textContent = "Post Comment";
  }


  await openComments(postId);

  await loadArtClassPosts();
}


// =====================================================
// HTML SAFETY
// =====================================================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

  return escapeHTML(value);
}


// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  loadArtClassPosts
);
