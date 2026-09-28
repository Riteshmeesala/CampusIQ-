package com.campusiq.ai.repository;

import com.campusiq.ai.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<ChatSession> findBySessionId(String sessionId);

    Optional<ChatSession> findByUserIdAndSessionId(Long userId, String sessionId);

    List<ChatSession> findByUserIdAndPinnedTrueOrderByUpdatedAtDesc(Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatSession s WHERE s.sessionId = :sid AND s.userId = :uid")
    void deleteBySessionIdAndUserId(@Param("sid") String sessionId, @Param("uid") Long userId);
}
