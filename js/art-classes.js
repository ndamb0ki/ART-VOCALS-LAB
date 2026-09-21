// =====================================================
// NDAMBUKI ART LAB — ART CLASS COMMUNITY
// =====================================================

const communityGrid =
  document.getElementById("communityGrid");


// =====================================================
// VISITOR ID
// =====================================================

function getVisitorId() {

  let visitorId =
    localStorage.getItem("ndambuki-visitor-id");

  if (!visitorId) {

    visitorId =
      crypto.randomUUID();

    localStorage.setItem(
      "ndambuki-visitor-id",
      visitorId
    );
  }

  return visitorId;
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


  const { data, error } =
    await supabaseClient
      .from("art_class_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(
      "Error loading art class posts:",
      error
    );


    communityGrid.innerHTML = `
      <div class="feed-empty">
        <h3>Something went wrong.</h3>
        <p>We couldn't load the Art Lab posts.</p>
      </div>
    `;

    return;
  }


  if (!data || data.length === 0) {

    communityGrid.innerHTML = `
      <div class="feed-empty">
        <h3>No posts yet.</h3>
        <p>New Art Lab stories are coming soon.</p>
      </div>
    `;

    return;
  }


  communityGrid.innerHTML = "";


  data.forEach((post, index) => {

    const card =
      createPostCard(post, index);


    communityGrid.appendChild(card);


    loadComments(post.id);

  });

}


// =====================================================
// BENTO PATTERN
// =====================================================
//
// Pattern:
//
// 0 = LARGE
// 1 = NORMAL
// 2 = TALL
// 3 = NORMAL
// 4 = WIDE
// 5 = NORMAL
// 6 = LARGE
// 7 = NORMAL
// 8 = TALL
// 9 = WIDE
//
// This repeats as more posts are added.
// =====================================================

function getBentoClass(index) {

  const pattern =
    index % 10;


  if (
    pattern === 0 ||
    pattern === 6
  ) {

    return "large";

  }


  if (
    pattern === 2 ||
    pattern === 8
  ) {

    return "tall";

  }


  if (
    pattern === 4 ||
    pattern === 9
  ) {

    return "wide";

  }


  return "";

}


// =====================================================
// CREATE POST CARD
// =====================================================

function createPostCard(
  post,
  index
) {

  const card =
    document.createElement("article");


  const bentoClass =
    getBentoClass(index);


  card.className =
    `community-card ${bentoClass}`;


  const image =
    escapeHTML(
      post.image_url || ""
    );


  const title =
    escapeHTML(
      post.title || "Art Lab"
    );


  const description =
    escapeHTML(
      post.description || ""
    );


  const category =
    escapeHTML(
      post.category || "Art Class"
    );


  card.innerHTML = `

    <!-- IMAGE -->

    <img
      src="${image}"
      alt="${title}"
      loading="lazy"
      class="community-image"
    >


    <!-- DARK OVERLAY -->

    <div class="card-gradient"></div>


    <!-- CARD CONTENT -->

    <div class="card-content">

      <span class="card-category">
        ${category}
      </span>


      <h3>
        ${title}
      </h3>


      <p>
        ${description}
      </p>


      <div class="card-actions">

        <button
          class="card-action like-button"
          data-post-id="${post.id}"
          aria-label="Like this post"
          type="button"
        >

          <span class="heart">
            ♡
          </span>

          <span class="like-count">
            ${post.likes_count || 0}
          </span>

        </button>


        <button
          class="card-action comment-button"
          data-post-id="${post.id}"
          type="button"
        >

          💬 Comments

        </button>

      </div>

    </div>


    <!-- COMMENTS -->

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
          data-post-id="${post.id}"
          type="button"
          aria-label="Close comments"
        >
          ×
        </button>

      </div>


      <div
        class="comment-list"
        id="comment-list-${post.id}"
      >

        <p>
          Loading comments...
        </p>

      </div>


      <form
        class="comment-form"
        data-post-id="${post.id}"
      >

        <input
          type="text"
          name="name"
          placeholder="Your name"
          maxlength="50"
          required
        >


        <textarea
          name="comment"
          placeholder="Write a comment..."
          maxlength="500"
          required
        ></textarea>


        <button
          type="submit"
        >
          Post comment
        </button>

      </form>

    </div>

  `;


  // ===================================================
  // LIKE
  // ===================================================

  const likeButton =
    card.querySelector(
      ".like-button"
    );


  likeButton.addEventListener(
    "click",
    () => {

      likePost(
        post.id,
        likeButton
      );

    }
  );


  // ===================================================
  // OPEN COMMENTS
  // ===================================================

  const commentButton =
    card.querySelector(
      ".comment-button"
    );


  commentButton.addEventListener(
    "click",
    () => {

      const panel =
        document.getElementById(
          `comments-${post.id}`
        );


      if (panel) {

        panel.classList.add(
          "active"
        );

      }

    }
  );


  // ===================================================
  // CLOSE COMMENTS
  // ===================================================

  const closeButton =
    card.querySelector(
      ".close-comments"
    );


  closeButton.addEventListener(
    "click",
    () => {

      const panel =
        document.getElementById(
          `comments-${post.id}`
        );


      if (panel) {

        panel.classList.remove(
          "active"
        );

      }

    }
  );


  // ===================================================
  // COMMENT FORM
  // ===================================================

  const form =
    card.querySelector(
      ".comment-form"
    );


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      submitComment(
        post.id,
        form
      );

    }
  );


  return card;

}


// =====================================================
// LIKE POST
// =====================================================

async function likePost(
  postId,
  button
) {

  const visitorId =
    getVisitorId();


  const heart =
    button.querySelector(
      ".heart"
    );


  const count =
    button.querySelector(
      ".like-count"
    );


  const {
    data: existingLike,
    error: checkError
  } =
    await supabaseClient
      .from("art_class_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("visitor_id", visitorId)
      .maybeSingle();


  if (checkError) {

    console.error(
      "Like check error:",
      checkError
    );

    return;
  }


  if (existingLike) {

    await supabaseClient
      .from("art_class_likes")
      .delete()
      .eq(
        "id",
        existingLike.id
      );


    heart.textContent =
      "♡";

  }

  else {

    const { error } =
      await supabaseClient
        .from("art_class_likes")
        .insert({
          post_id: postId,
          visitor_id: visitorId
        });


    if (error) {

      console.error(
        "Like error:",
        error
      );

      return;
    }


    heart.textContent =
      "♥";

  }


  // ===================================================
  // GET UPDATED LIKE COUNT
  // ===================================================

  const {
    count: newCount
  } =
    await supabaseClient
      .from("art_class_likes")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq(
        "post_id",
        postId
      );


  count.textContent =
    newCount || 0;


  // ===================================================
  // SAVE COUNT
  // ===================================================

  await supabaseClient
    .from("art_class_posts")
    .update({
      likes_count:
        newCount || 0
    })
    .eq(
      "id",
      postId
    );

}


// =====================================================
// LOAD COMMENTS
// =====================================================

async function loadComments(
  postId
) {

  const list =
    document.getElementById(
      `comment-list-${postId}`
    );


  if (!list) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("art_class_comments")
      .select("*")
      .eq(
        "post_id",
        postId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Comment loading error:",
      error
    );


    list.innerHTML =
      "<p>Unable to load comments.</p>";

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    list.innerHTML =
      "<p>No comments yet. Be the first!</p>";

    return;
  }


  list.innerHTML = "";


  data.forEach(
    comment => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "comment";


      item.innerHTML = `

        <strong>
          ${escapeHTML(comment.name)}
        </strong>

        <p>
          ${escapeHTML(comment.comment)}
        </p>

      `;


      list.appendChild(
        item
      );

    }
  );

}


// =====================================================
// SUBMIT COMMENT
// =====================================================

async function submitComment(
  postId,
  form
) {

  const name =
    form.name.value.trim();


  const comment =
    form.comment.value.trim();


  if (
    !name ||
    !comment
  ) {

    return;

  }


  const submitButton =
    form.querySelector(
      "button"
    );


  submitButton.disabled =
    true;


  submitButton.textContent =
    "Posting...";


  const { error } =
    await supabaseClient
      .from("art_class_comments")
      .insert({
        post_id: postId,
        name: name,
        comment: comment
      });


  if (error) {

    console.error(
      "Comment submission error:",
      error
    );


    alert(
      "Unable to post your comment. Please try again."
    );


    submitButton.disabled =
      false;


    submitButton.textContent =
      "Post comment";


    return;

  }


  form.reset();


  submitButton.disabled =
    false;


  submitButton.textContent =
    "Post comment";


  await loadComments(
    postId
  );

}


// =====================================================
// SECURITY HELPER
// =====================================================

function escapeHTML(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadArtClassPosts();

  }
);
